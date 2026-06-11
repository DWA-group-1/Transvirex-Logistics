"""initial billing schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


invoice_status = postgresql.ENUM(
    "pending",
    "paid",
    name="invoice_status",
    create_type=False,
)


def upgrade() -> None:
    invoice_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "invoice",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("number", sa.String(), nullable=False, unique=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "invoice_date",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("delivery_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "status",
            invoice_status,
            nullable=False,
            server_default="pending",
        ),
        sa.Column("payment_date", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index("ix_invoice_customer_id", "invoice", ["customer_id"])

    op.create_table(
        "invoice_line",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "invoice_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("invoice.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("description", sa.String(), nullable=False, server_default=""),
    )

    op.create_index("ix_invoice_line_invoice_id", "invoice_line", ["invoice_id"])

    op.create_table(
        "billable_delivery",
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("service_type", sa.String(), nullable=True),
        sa.Column("priority", sa.String(), nullable=True),
        sa.Column("weight_kg", sa.Numeric(10, 3), nullable=True),
        sa.Column("parcel_count", sa.Integer(), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("invoiced_invoice_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.create_index(
        "ix_billable_delivery_customer_status",
        "billable_delivery",
        ["customer_id", "status"],
    )

    op.create_table(
        "customer_ref",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("customer_ref")
    op.drop_index("ix_billable_delivery_customer_status", table_name="billable_delivery")
    op.drop_table("billable_delivery")
    op.drop_index("ix_invoice_line_invoice_id", table_name="invoice_line")
    op.drop_table("invoice_line")
    op.drop_index("ix_invoice_customer_id", table_name="invoice")
    op.drop_table("invoice")
    invoice_status.drop(op.get_bind(), checkfirst=True)