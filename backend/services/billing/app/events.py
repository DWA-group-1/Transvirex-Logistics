"""
Event handlers for the billing service.

Subscribes to:
  - delivery.events  (group: billing)
  - catalog.events   (group: billing)
"""
import logging
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app import db as db_holder
from .models import BillableDelivery, CustomerRef
from .pricing import price_delivery

log = logging.getLogger(__name__)


async def on_delivery_created(payload: dict) -> None:
    """
    Upsert a BillableDelivery row in 'pending' state.
    Idempotent: no-op if the row already exists in any state.
    """
    delivery_id = payload.get("delivery_id")
    customer_id = payload.get("customer_id")
    if not delivery_id or not customer_id:
        log.warning("delivery.created missing required fields: %s", payload)
        return

    async with db_holder.SessionMaker() as session:
        stmt = (
            pg_insert(BillableDelivery)
            .values(
                delivery_id=delivery_id,
                customer_id=customer_id,
                status="pending",
                service_type=payload.get("service_type"),
                priority=payload.get("priority"),
                weight_kg=payload.get("weight_kg"),
                parcel_count=payload.get("parcel_count"),
            )
            .on_conflict_do_nothing(index_elements=["delivery_id"])
        )
        await session.execute(stmt)
        await session.commit()
        log.info("billable_delivery upserted (created): %s", delivery_id)


async def on_delivery_completed(payload: dict) -> None:
    """
    Mark the BillableDelivery as completed, set completed_at, and compute amount.
    Idempotent: no-op if already completed.
    """
    delivery_id = payload.get("delivery_id")
    completed_at = payload.get("completed_at")
    if not delivery_id:
        log.warning("delivery.completed missing delivery_id: %s", payload)
        return

    async with db_holder.SessionMaker() as session:
        result = await session.execute(
            select(BillableDelivery).where(
                BillableDelivery.delivery_id == delivery_id
            )
        )
        row = result.scalar_one_or_none()

        if row is None:
            # Delivery was created before billing service existed — create it now
            row = BillableDelivery(
                delivery_id=delivery_id,
                customer_id=payload.get("customer_id"),
                status="pending",
                service_type=payload.get("service_type"),
                priority=payload.get("priority"),
                weight_kg=payload.get("weight_kg"),
                parcel_count=payload.get("parcel_count"),
            )
            session.add(row)

        if row.status == "completed":
            log.info("delivery already completed, skipping: %s", delivery_id)
            return

        # Update pricing attributes if extended payload provided
        if payload.get("service_type"):
            row.service_type = payload["service_type"]
        if payload.get("priority"):
            row.priority = payload["priority"]
        if payload.get("weight_kg") is not None:
            row.weight_kg = Decimal(str(payload["weight_kg"]))
        if payload.get("parcel_count") is not None:
            row.parcel_count = payload["parcel_count"]

        row.status = "completed"
        row.completed_at = completed_at
        row.amount = price_delivery(
            service_type=row.service_type,
            priority=row.priority,
            weight_kg=row.weight_kg,
            parcel_count=row.parcel_count,
        )

        await session.commit()
        log.info("billable_delivery completed, amount=%s: %s", row.amount, delivery_id)


async def on_delivery_cancelled(payload: dict) -> None:
    """
    Mark the BillableDelivery as cancelled so it's excluded from billing.
    Idempotent.
    """
    delivery_id = payload.get("delivery_id")
    if not delivery_id:
        return

    async with db_holder.SessionMaker() as session:
        result = await session.execute(
            select(BillableDelivery).where(
                BillableDelivery.delivery_id == delivery_id
            )
        )
        row = result.scalar_one_or_none()
        if row and row.status != "cancelled":
            row.status = "cancelled"
            await session.commit()
            log.info("billable_delivery cancelled: %s", delivery_id)


async def on_customer_created(payload: dict) -> None:
    """Upsert local customer ref for invoice display."""
    customer_id = payload.get("id") or payload.get("customer_id")
    name = payload.get("name", "")
    if not customer_id:
        return

    async with db_holder.SessionMaker() as session:
        stmt = (
            pg_insert(CustomerRef)
            .values(id=customer_id, name=name)
            .on_conflict_do_update(
                index_elements=["id"],
                set_={"name": name},
            )
        )
        await session.execute(stmt)
        await session.commit()


async def on_customer_updated(payload: dict) -> None:
    """Same as created — upsert."""
    await on_customer_created(payload)
