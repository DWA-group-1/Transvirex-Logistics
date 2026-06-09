from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from transvirex_common.database import get_db
from transvirex_common.deps import require_role

from ..kpi import compute_month
from ..models import KpiSnapshot, KpiSource
from ..schemas import KpiTrend, KpiValues

router = APIRouter(prefix="/kpi", tags=["kpi"])


def _current_month() -> date:
    today = datetime.now(timezone.utc).date()
    return date(today.year, today.month, 1)


def _row_to_values(row: KpiSnapshot) -> KpiValues:
    return KpiValues(
        period_month=row.period_month,
        total_deliveries=row.total_deliveries,
        on_time_pct=row.on_time_pct,
        avg_delivery_time_h=row.avg_delivery_time_h,
        customer_satisfaction=row.customer_satisfaction,
        revenue=row.revenue,
        active_drivers=row.active_drivers,
        incidents_count=row.incidents_count,
        source=row.source.value,
    )


@router.get("/current", response_model=KpiValues)
async def current_kpis(
    _: str = Depends(require_role("manager", "dispatcher")),
    db: AsyncSession = Depends(get_db),
):
    values = await compute_month(db, _current_month())
    return KpiValues(source="live", **values)


@router.get("/trend", response_model=KpiTrend)
async def kpi_trend(
    months: int = Query(12, ge=1, le=60),
    _: str = Depends(require_role("manager", "dispatcher")),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        (
            await db.execute(
                select(KpiSnapshot)
                .order_by(KpiSnapshot.period_month.desc())
                .limit(months)
            )
        )
        .scalars()
        .all()
    )
    return KpiTrend(months=[_row_to_values(r) for r in reversed(rows)])


@router.post("/snapshot", response_model=KpiValues)
async def snapshot_month(
    month: date | None = Query(
        None, description="First day of month to snapshot; defaults to current"
    ),
    _: str = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
):
    base = month or _current_month()
    target = date(base.year, base.month, 1)
    values = await compute_month(db, target)

    update_cols = {k: v for k, v in values.items() if k != "period_month"}
    update_cols["source"] = KpiSource.COMPUTED.value
    update_cols["updated_at"] = func.now()

    stmt = (
        pg_insert(KpiSnapshot)
        .values(source=KpiSource.COMPUTED.value, **values)
        .on_conflict_do_update(
            index_elements=["period_month"],
            set_=update_cols,
            where=(KpiSnapshot.source == KpiSource.COMPUTED.value),
        )
    )
    await db.execute(stmt)
    await db.commit()
    return KpiValues(source="computed", **values)
