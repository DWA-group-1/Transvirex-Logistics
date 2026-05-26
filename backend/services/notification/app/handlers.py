import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from .database import SessionMaker
from .events import EventBus
from .manager import manager
from .models import Notification

logger = logging.getLogger(__name__)


async def _persist_and_fanout(
    db: AsyncSession,
    *,
    target_user_id: int | None,
    target_role: str | None,
    type_: str,
    title: str,
    message: str,
    payload: dict | None = None,
    sender_id: int | None = None,
) -> None:
    notif = Notification(
        target_user_id=target_user_id,
        target_role=target_role,
        type=type_,
        title=title,
        message=message,
        payload=json.dumps(payload) if payload else None,
        sender_id=sender_id,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    ws_data = {
        "id": notif.id,
        "type": notif.type,
        "title": notif.title,
        "message": notif.message,
        "payload": notif.payload,
        "created_at": notif.created_at.isoformat(),
    }
    if target_user_id is not None:
        await manager.send_to_user(target_user_id, ws_data)
    if target_role is not None:
        await manager.broadcast_to_role(target_role, ws_data)


async def handle_delivery_assigned(envelope: dict) -> None:
    data = envelope["data"]
    async with SessionMaker() as db:
        await _persist_and_fanout(
            db,
            target_user_id=data["driver_id"],
            target_role=None,
            type_="new_mission",
            title="New mission assigned",
            message=f"Delivery #{data["delivery_id"]} was assigned to you.",
            payload={"delivery_id": data["delivery_id"]},
        )


async def handle_incident_declared(envelope: dict) -> None:
    data = envelope["data"]
    async with SessionMaker() as db:
        await _persist_and_fanout(
            db,
            target_user_id=None,
            target_role="dispatcher",
            type_="incident_declared",
            title="Incident declared",
            message=f"Incident on the delivery #{data['delivery_id']}",
            payload=data,
        )


EVENT_HANDLERS = {
    "delivery.assigned": handle_delivery_assigned,
    "incident.declared": handle_incident_declared,
}


async def _dispatch(envelope: dict) -> None:
    event_type = envelope.get("event_type")
    handler = EVENT_HANDLERS.get(event_type)
    if handler is None:
        logger.info("no handler for event_type=%s, ignoring", event_type)
        return
    await handler(envelope)


def register_event_handlers(bus: EventBus) -> None:
    bus.on("delivery.events", _dispatch)
    bus.on("catalog.events", _dispatch)
    bus.on("billing.events", _dispatch)
