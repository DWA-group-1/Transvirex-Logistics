import logging
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from . import db
from .models import DeliveryFact, DriverState, IncidentFact, RevenueFact

logger = logging.getLogger(__name__)


def _occurred_at(envelope: dict) -> datetime | None:
    raw = envelope.get("occurred_at")
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw)
    except (ValueError, TypeError):
        return None


def _uuid(value) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return None


def _period_month(dt: datetime | None) -> date | None:
    return date(dt.year, dt.month, 1) if dt else None


async def on_delivery_event(envelope: dict) -> None:
    et = envelope.get("event_type")
    data = envelope.get("data", {})
    occurred = _occurred_at(envelope)

    if et == "delivery.created":
        await _delivery_created(data, occurred)
    elif et == "delivery.completed":
        await _delivery_completed(data, occurred)
    elif et == "delivery.cancelled":
        await _delivery_status(data, "cancelled")
    elif et == "incident.declared":
        await _incident_declared(data, occurred)


async def _delivery_created(data: dict, occurred: datetime | None) -> None:
    delivery_id = _uuid(data.get("delivery_id"))
    customer_id = _uuid(data.get("customer_id"))
    if delivery_id is None or customer_id is None:
        logger.warning("delivery.created missing ids, skipping: %s", data)
        return
    async with db.SessionMaker() as session:
        stmt = (
            pg_insert(DeliveryFact)
            .values(
                delivery_id=delivery_id,
                customer_id=customer_id,
                status="created",
                created_at=occurred,
            )
            .on_conflict_do_nothing(index_elements=["delivery_id"])
        )
        await session.execute(stmt)
        await session.commit()


async def _delivery_completed(data: dict, occurred: datetime | None) -> None:
    delivery_id = _uuid(data.get("delivery_id"))
    if delivery_id is None:
        return
    async with db.SessionMaker() as session:
        fact = await session.get(DeliveryFact, delivery_id)
        if fact is None:
            logger.warning("delivery.completed for unknown delivery %s", delivery_id)
            return
        fact.status = "completed"
        fact.completed_at = occurred
        if fact.expected_date is not None and occurred is not None:
            fact.on_time = occurred <= fact.expected_date
        await session.commit()


async def _delivery_status(data: dict, status: str) -> None:
    delivery_id = _uuid(data.get("delivery_id"))
    if delivery_id is None:
        return
    async with db.SessionMaker() as session:
        fact = await session.get(DeliveryFact, delivery_id)
        if fact is None:
            return
        fact.status = status
        await session.commit()


async def _incident_declared(data: dict, occurred: datetime | None) -> None:
    incident_id = _uuid(data.get("incident_id"))
    if incident_id is None:
        return
    async with db.SessionMaker() as session:
        stmt = (
            pg_insert(IncidentFact)
            .values(
                incident_id=incident_id,
                delivery_id=_uuid(data.get("delivery_id")),
                declared_at=occurred,
                period_month=_period_month(occurred) or date(1970, 1, 1),
            )
            .on_conflict_do_nothing(index_elements=["incident_id"])
        )
        await session.execute(stmt)
        await session.commit()


async def on_catalog_event(envelope: dict) -> None:
    et = envelope.get("event_type")
    data = envelope.get("data", {})
    if et == "driver.created":
        await _driver_active(data, active=True)
    elif et == "driver.deactivated":
        await _driver_active(data, active=False)


async def _driver_active(data: dict, *, active: bool) -> None:
    driver_id = _uuid(data.get("driver_id"))
    if driver_id is None:
        return
    async with db.SessionMaker() as session:
        stmt = (
            pg_insert(DriverState)
            .values(driver_id=driver_id, active=active)
            .on_conflict_do_update(
                index_elements=["driver_id"], set_={"active": active}
            )
        )
        await session.execute(stmt)
        await session.commit()


async def on_billing_event(envelope: dict) -> None:
    et = envelope.get("event_type")
    data = envelope.get("data", {})
    if et != "invoice.paid":
        return

    invoice_id = _uuid(data.get("invoice_id"))
    if invoice_id is None:
        return
    try:
        amount = Decimal(str(data.get("amount", "0")))
    except (InvalidOperation, ValueError):
        amount = Decimal("0")
    paid_at = _occurred_at(envelope)
    async with db.SessionMaker() as session:
        stmt = (
            pg_insert(RevenueFact)
            .values(
                invoice_id=invoice_id,
                customer_id=_uuid(data.get("customer_id")),
                amount=amount,
                paid_at=paid_at,
                period_month=_period_month(paid_at) or date(1970, 1, 1),
            )
            .on_conflict_do_nothing(index_elements=["invoice_id"])
        )
        await session.execute(stmt)
        await session.commit()
