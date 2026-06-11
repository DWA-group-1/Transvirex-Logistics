import enum
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy import Index, Integer, Numeric, String, func, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from transvirex_common.database import Base


class KpiSource(str, enum.Enum):
    SEEDED = "seeded"
    COMPUTED = "computed"


class KpiSnapshot(Base):
    __tablename__ = "kpi_snapshots"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    period_month: Mapped[date] = mapped_column(
        Date, nullable=False, unique=True, index=True
    )
    total_deliveries: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    on_time_pct: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    avg_delivery_time_h: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2), nullable=True
    )
    customer_satisfaction: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )  # no live source — seeded only
    revenue: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, server_default="0"
    )
    active_drivers: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    incidents_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    source: Mapped[KpiSource] = mapped_column(
        SAEnum(KpiSource, values_callable=lambda e: [x.value for x in e]),
        nullable=False,
        server_default=KpiSource.COMPUTED.value,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class DeliveryFact(Base):
    __tablename__ = "delivery_facts"

    delivery_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    customer_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String, nullable=False, server_default="created"
    )  # created / completed / cancelled
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expected_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    on_time: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    __table_args__ = (
        Index("ix_delivery_facts_status_completed", "status", "completed_at"),
    )


class DriverState(Base):
    __tablename__ = "driver_states"

    driver_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class RevenueFact(Base):
    __tablename__ = "revenue_facts"

    invoice_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    customer_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True, index=True
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, server_default="0"
    )
    period_month: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class IncidentFact(Base):
    __tablename__ = "incident_facts"

    incident_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    delivery_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True, index=True
    )
    declared_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    period_month: Mapped[date] = mapped_column(Date, nullable=False, index=True)
