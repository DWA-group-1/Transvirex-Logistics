import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from transvirex_common.events import EventBus

from . import db
from .manager import manager
from .models import Notification

logger = logging.getLogger(__name__)


def _delivery_label(data: dict) -> str:
    """Human-readable delivery label: the reference if present, else a short id.

    Guards against events that don't carry `reference` (older events, or a
    producer that hasn't been updated) so a missing field can never crash the
    handler and stall the stream.
    """
    ref = data.get("reference")
    if ref:
        return ref
    delivery_id = data.get("delivery_id", "")
    return f"#{delivery_id[:8]}" if delivery_id else "#unknown"


async def _persist_and_fanout(
    db: AsyncSession,
    *,
    target_user_id: str | None,
    target_role: str | None,
    type_: str,
    title: str,
    message: str,
    payload: dict | None = None,
    sender_id: str | None = None,
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


async def handle_delivery_assigned(enveloppe: dict) -> None:
    data = enveloppe["data"]
    auth_user_id = data.get("driver_auth_user_id")
    if not auth_user_id:
        logger.warning(
            "delivery.assigned missing driver_auth_user_id, skipping fanout: %s",
            data.get("delivery_id"),
        )
        return

    label = _delivery_label(data)
    async with db.SessionMaker() as session:
        await _persist_and_fanout(
            session,
            target_user_id=auth_user_id,
            target_role=None,
            type_="new_mission",
            title="New mission assigned",
            message=f"Delivery {label} was assigned to you.",
            payload={
                "delivery_id": data.get("delivery_id"),
                "reference": data.get("reference"),
            },
        )


async def handle_incident_declared(enveloppe: dict) -> None:
    data = enveloppe["data"]
    label = _delivery_label(data)
    async with db.SessionMaker() as session:
        await _persist_and_fanout(
            session,
            target_user_id=None,
            target_role="dispatcher",
            type_="incident_declared",
            title="Incident declared",
            message=f"Incident on delivery {label}",
            payload=data,
        )


EVENT_HANDLERS = {
    "delivery.assigned": handle_delivery_assigned,
    "incident.declared": handle_incident_declared,
}


async def _dispatch(enveloppe: dict) -> None:
    event_type = enveloppe.get("event_type")
    handler = EVENT_HANDLERS.get(event_type)
    if handler is None:
        logger.info("no handler for event_type=%s, ignoring", event_type)
        return
    await handler(enveloppe)


def register_event_handlers(bus: EventBus) -> None:
    bus.on("delivery.events", _dispatch)
    bus.on("catalog.events", _dispatch)
    bus.on("billing.events", _dispatch)
