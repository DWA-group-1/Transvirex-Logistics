from datetime import date
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import DeliveryFact, DriverState, IncidentFact, RevenueFact


def month_bounds(month: date) -> tuple[date, date]:
    start = date(month.year, month.month, 1)
    end = (
        date(start.year + 1, 1, 1)
        if start.month == 12
        else date(start.year, start.month + 1, 1)
    )
    return start, end


async def compute_month(session: AsyncSession, month: date) -> dict:
    """Roll up the fact tables into KPI values for one month.

    Active_Drivers is point-in-time (current state), not month-historical.
    on_time% / avg time reflect only deliveries completed in the window.
    """
    start, end = month_bounds(month)

    total_deliveries = await session.scalar(
        select(func.count())
        .select_from(DeliveryFact)
        .where(DeliveryFact.created_at >= start, DeliveryFact.created_at < end)
    )

    completed = and_(
        DeliveryFact.status == "completed",
        DeliveryFact.completed_at >= start,
        DeliveryFact.completed_at < end,
    )

    avg_hours = await session.scalar(
        select(
            func.avg(
                func.extract(
                    "epoch", DeliveryFact.completed_at - DeliveryFact.created_at
                )
                / 3600.0
            )
        ).where(completed, DeliveryFact.created_at.is_not(None))
    )

    on_time_known = await session.scalar(
        select(func.count())
        .select_from(DeliveryFact)
        .where(completed, DeliveryFact.on_time.is_not(None))
    )
    on_time_true = await session.scalar(
        select(func.count())
        .select_from(DeliveryFact)
        .where(completed, DeliveryFact.on_time.is_(True))
    )
    on_time_pct: Decimal | None = None
    if on_time_known:
        on_time_pct = round(Decimal(on_time_true) / Decimal(on_time_known) * 100, 2)

    revenue = await session.scalar(
        select(func.coalesce(func.sum(RevenueFact.amount), 0)).where(
            RevenueFact.period_month == start
        )
    )
    incidents_count = await session.scalar(
        select(func.count())
        .select_from(IncidentFact)
        .where(IncidentFact.period_month == start)
    )
    active_drivers = await session.scalar(
        select(func.count())
        .select_from(DriverState)
        .where(DriverState.active.is_(True))
    )

    return {
        "period_month": start,
        "total_deliveries": int(total_deliveries or 0),
        "on_time_pct": on_time_pct,
        "avg_delivery_time_h": (
            round(Decimal(str(avg_hours)), 2) if avg_hours is not None else None
        ),
        "customer_satisfaction": None,
        "revenue": Decimal(revenue or 0),
        "active_drivers": int(active_drivers or 0),
        "incidents_count": int(incidents_count or 0),
    }
