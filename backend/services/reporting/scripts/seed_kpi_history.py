import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy.dialects.postgresql import insert as pg_insert
from transvirex_common.database import create_session_factory

from app.config import settings
from app.models import KpiSnapshot, KpiSource

# From the workbook (KPI_DASHBOARD): (month, total, on_time%, avg_h, csat, revenue, drivers, incidents)
HISTORY = [
    (date(2025, 11, 1), 13200, "93.5", "4.7", "4.7", "264000", 148, 21),
    (date(2025, 12, 1), 13800, "95.1", "4.2", "4.8", "276000", 152, 18),
    (date(2026, 1, 1), 14250, "94.2", "4.5", "4.7", "285000", 158, 23),
    (date(2026, 2, 1), 8450, "91.8", "5.1", "4.6", "169000", 162, 12),  # partial
]


async def main() -> None:
    maker = create_session_factory(settings.database_url)
    async with maker() as session:
        for pm, total, ot, avg_h, csat, rev, drivers, inc in HISTORY:
            await session.execute(
                pg_insert(KpiSnapshot)
                .values(
                    period_month=pm,
                    total_deliveries=total,
                    on_time_pct=Decimal(ot),
                    avg_delivery_time_h=Decimal(avg_h),
                    customer_satisfaction=Decimal(csat),
                    revenue=Decimal(rev),
                    active_drivers=drivers,
                    incidents_count=inc,
                    source=KpiSource.SEEDED.value,
                )
                .on_conflict_do_nothing(index_elements=["period_month"])
            )
        await session.commit()
    print(f"seeded {len(HISTORY)} historical KPI snapshots")


if __name__ == "__main__":
    asyncio.run(main())
