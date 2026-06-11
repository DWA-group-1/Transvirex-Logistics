import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from .models import InvoiceStatus


class InvoiceLineOut(BaseModel):
    id: uuid.UUID
    delivery_id: uuid.UUID
    amount: Decimal
    description: str

    class Config:
        from_attributes = True


class InvoiceOut(BaseModel):
    id: uuid.UUID
    number: str
    customer_id: uuid.UUID
    invoice_date: datetime
    due_date: datetime
    period_start: datetime
    period_end: datetime
    total_amount: Decimal
    delivery_count: int
    status: InvoiceStatus
    payment_date: datetime | None
    lines: list[InvoiceLineOut] = []

    class Config:
        from_attributes = True


class GenerateInvoicesRequest(BaseModel):
    period_start: datetime
    period_end: datetime


class GenerateInvoicesResponse(BaseModel):
    invoices_created: int
    invoice_numbers: list[str]


class MarkPaidRequest(BaseModel):
    payment_date: datetime | None = None


class BillableDeliveryOut(BaseModel):
    delivery_id: uuid.UUID
    customer_id: uuid.UUID
    completed_at: datetime | None
    status: str
    amount: Decimal | None
    invoiced_invoice_id: uuid.UUID | None

    class Config:
        from_attributes = True
