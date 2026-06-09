from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class KpiValues(BaseModel):
    period_month: date
    total_deliveries: int
    on_time_pct: Decimal | None = None
    avg_delivery_time_h: Decimal | None = None
    customer_satisfaction: Decimal | None = None
    revenue: Decimal
    active_drivers: int
    incidents_count: int
    source: str


class KpiTrend(BaseModel):
    months: list[KpiValues]
