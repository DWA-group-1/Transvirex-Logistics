import logging
from contextlib import asynccontextmanager

from fastapi import (
    Depends,
    FastAPI,
    Header,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from transvirex_common.database import create_session_factory, get_db
from transvirex_common.events import EventBus
from transvirex_common.security import decode_access_token

from . import db
from .config import settings
from .handlers import register_event_handlers
from .manager import manager
from .models import Notification
from .schemas import MarkReadRequest, NotificationCreate, NotificationOut

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    maker = create_session_factory(settings.database_url)
    app.state.db_session_maker = maker
    db.set_session_maker(maker)
    bus = EventBus(settings.redis_url, producer_name="notification")
    register_event_handlers(bus)
    await bus.start()
    app.state.bus = bus
    try:
        yield
    finally:
        await bus.stop()


app = FastAPI(title="Notification Service", version="1.0.0", lifespan=lifespan)

# ─── Utils ─────────────────────────────────────────────────────────────────


def current_user_from_headers(
    x_user_id: str = Header(..., alias="X-User-Id"),
    x_user_role: str = Header(..., alias="X-User-Role"),
) -> dict:
    return {"user_id": x_user_id, "role": x_user_role}


# ─── Routes HTTP ───────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/notifications", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    user: dict = Depends(current_user_from_headers),
    db: AsyncSession = Depends(get_db),
):
    user_id: int = user["user_id"]
    role: str = user["role"]

    filters = [
        Notification.target_user_id == user_id,
        Notification.target_role == role,
    ]
    query = (
        select(Notification)
        .where(or_(*filters))
        .order_by(Notification.created_at.desc())
    )

    if unread_only:
        query = query.where(Notification.is_read == False)

    result = await db.execute(query)
    return result.scalars().all()


@app.post(
    "/notifications",
    response_model=NotificationOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_notification(
    data: NotificationCreate,
    user: dict = Depends(current_user_from_headers),
    db: AsyncSession = Depends(get_db),
):
    if not data.target_user_id and not data.target_role:
        raise HTTPException(400, "Provide target_user_id or target_role")

    notif = Notification(
        target_user_id=data.target_user_id,
        target_role=data.target_role,
        type=data.type,
        title=data.title,
        message=data.message,
        payload=data.payload,
        sender_id=user["user_id"],
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    # Sérialise pour le WebSocket
    ws_data = {
        "id": notif.id,
        "type": notif.type,
        "title": notif.title,
        "message": notif.message,
        "payload": notif.payload,
        "created_at": notif.created_at.isoformat(),
    }

    # Diffusion temps réel
    if data.target_user_id:
        await manager.send_to_user(data.target_user_id, ws_data)
    if data.target_role:
        await manager.broadcast_to_role(data.target_role, ws_data)

    return notif


@app.put("/notifications/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_as_read(
    body: MarkReadRequest,
    user: dict = Depends(current_user_from_headers),
    db: AsyncSession = Depends(get_db),
):
    user_id: int = user["user_id"]
    role: str = user["role"]

    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.id.in_(body.notification_ids),
                or_(
                    Notification.target_user_id == user_id,
                    Notification.target_role == role,
                ),
            )
        )
    )
    notifs = result.scalars().all()
    for n in notifs:
        n.is_read = True
    await db.commit()


# ─── WebSocket ─────────────────────────────────────────────────────────────


@app.websocket("/ws/notifications")
async def ws_notifications(
    websocket: WebSocket,
    token: str = Query(...),  # ws://host/ws/notifications?token=<jwt>
    db: AsyncSession = Depends(get_db),
):
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id: str = payload["sub"]
    role: str = payload["role"]

    await manager.connect(websocket, user_id, role)

    # Envoie les notifs non lues stockées en DB
    result = await db.execute(
        select(Notification)
        .where(
            and_(
                Notification.is_read == False,
                or_(
                    Notification.target_user_id == user_id,
                    Notification.target_role == role,
                ),
            )
        )
        .order_by(Notification.created_at.asc())
    )
    pending = result.scalars().all()

    for notif in pending:
        await websocket.send_json(
            {
                "id": notif.id,
                "type": notif.type,
                "title": notif.title,
                "message": notif.message,
                "payload": notif.payload,
                "created_at": notif.created_at.isoformat(),
            }
        )

    # Boucle de maintien de connexion (le client peut envoyer un ping)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, role)
