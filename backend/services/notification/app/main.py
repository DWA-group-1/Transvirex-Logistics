"""
Notification Service.

Endpoints :
  GET  /notifications          → liste des notifs de l'utilisateur connecté
  POST /notifications          → créer et diffuser une notif (dispatcher/manager)
  PUT  /notifications/read     → marquer comme lues
  WS   /ws/notifications       → connexion temps réel
"""
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from .database import engine, get_db, Base, settings
from .models import Notification
from .schemas import NotificationCreate, NotificationOut, MarkReadRequest
from .security import decode_access_token
from .manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Notification Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Auth dependency (HTTP) ────────────────────────────────────────────────

def require_auth(authorization: str = Query(..., alias="Authorization")) -> dict:
    """Extrait et vérifie le JWT depuis le header Authorization."""
    raise HTTPException(500, "Use the HTTP header version")


def get_token_payload(token: str) -> dict:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8001/token")


def current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    return get_token_payload(token)


# ─── Routes HTTP ───────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/notifications", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    payload: dict = Depends(current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Retourne les notifications de l'utilisateur connecté :
    - les notifs ciblées par son user_id
    - les notifs broadcastées à son rôle
    """
    user_id: int = payload["user_id"]
    role: str = payload["role"]

    filters = [
        Notification.target_user_id == user_id,
        Notification.target_role == role,
    ]
    query = select(Notification).where(or_(*filters)).order_by(Notification.created_at.desc())

    if unread_only:
        query = query.where(Notification.is_read == False)

    result = await db.execute(query)
    return result.scalars().all()


@app.post("/notifications", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
async def create_notification(
    data: NotificationCreate,
    payload: dict = Depends(current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """
    Crée une notification et la diffuse immédiatement via WebSocket
    aux utilisateurs connectés concernés.
    Accessible à tous les rôles (chaque service appelant peut en créer).
    """
    if not data.target_user_id and not data.target_role:
        raise HTTPException(400, "Provide target_user_id or target_role")

    notif = Notification(
        target_user_id=data.target_user_id,
        target_role=data.target_role,
        type=data.type,
        title=data.title,
        message=data.message,
        payload=data.payload,
        sender_id=payload.get("user_id"),
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
    payload: dict = Depends(current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    """Marque les notifications spécifiées comme lues (uniquement les siennes)."""
    user_id: int = payload["user_id"]
    role: str = payload["role"]

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
    token: str = Query(...),        # ws://host/ws/notifications?token=<jwt>
    db: AsyncSession = Depends(get_db),
):
    """
    Connexion WebSocket authentifiée par JWT (passé en query param).
    À la connexion :
      1. Vérifie le token
      2. Enregistre la connexion dans le manager (by_user_id + by_role)
      3. Envoie les notifications non lues en attente (persistées en DB)
      4. Reste en écoute jusqu'à déconnexion
    """
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id: int = payload["user_id"]
    role: str = payload["role"]

    await manager.connect(websocket, user_id, role)

    # Envoie les notifs non lues stockées en DB
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.is_read == False,
                or_(
                    Notification.target_user_id == user_id,
                    Notification.target_role == role,
                ),
            )
        ).order_by(Notification.created_at.asc())
    )
    pending = result.scalars().all()

    for notif in pending:
        await websocket.send_json({
            "id": notif.id,
            "type": notif.type,
            "title": notif.title,
            "message": notif.message,
            "payload": notif.payload,
            "created_at": notif.created_at.isoformat(),
        })

    # Boucle de maintien de connexion (le client peut envoyer un ping)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, role)