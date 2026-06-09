import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app import db as db_holder
from app.models import BillableDelivery, Invoice, InvoiceLine, InvoiceStatus
from app.schemas import (
    BillableDeliveryOut,
    GenerateInvoicesRequest,
    GenerateInvoicesResponse,
    InvoiceOut,
    MarkPaidRequest,
)

router = APIRouter(prefix="/invoices", tags=["invoices"])

INVOICE_DUE_DAYS = 14


def _require_role(*roles: str):
    async def dep(request: Request):
        role = request.headers.get("X-User-Role", "")
        if role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role")
        return role

    return dep


@router.post(
    "/generate",
    response_model=GenerateInvoicesResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_require_role("billing", "manager"))],
)
async def generate_invoices(body: GenerateInvoicesRequest):
    async with db_holder.SessionMaker() as session:
        result = await session.execute(
            select(BillableDelivery)
            .where(
                BillableDelivery.status == "completed",
                BillableDelivery.invoiced_invoice_id.is_(None),
                BillableDelivery.completed_at >= body.period_start,
                BillableDelivery.completed_at <= body.period_end,
            )
            .order_by(BillableDelivery.customer_id)
        )

        deliveries = result.scalars().all()

        if not deliveries:
            return GenerateInvoicesResponse(invoices_created=0, invoice_numbers=[])

        by_customer: dict[uuid.UUID, list[BillableDelivery]] = {}

        for delivery in deliveries:
            by_customer.setdefault(delivery.customer_id, []).append(delivery)

        year = datetime.now(timezone.utc).year
        prefix = f"INV-{year}-"

        seq_result = await session.execute(
            select(func.count(Invoice.id)).where(Invoice.number.like(f"{prefix}%"))
        )

        existing_count = seq_result.scalar() or 0
        next_seq = existing_count + 1

        created_numbers: list[str] = []
        now = datetime.now(timezone.utc)

        for customer_id, rows in by_customer.items():
            total = sum(row.amount or Decimal("0") for row in rows)
            number = f"{prefix}{next_seq:03d}"
            next_seq += 1

            invoice = Invoice(
                number=number,
                customer_id=customer_id,
                invoice_date=now,
                due_date=now + timedelta(days=INVOICE_DUE_DAYS),
                period_start=body.period_start,
                period_end=body.period_end,
                total_amount=total,
                delivery_count=len(rows),
                status=InvoiceStatus.PENDING,
            )

            session.add(invoice)
            await session.flush()

            for row in rows:
                line = InvoiceLine(
                    invoice_id=invoice.id,
                    delivery_id=row.delivery_id,
                    amount=row.amount or Decimal("0"),
                    description=f"Delivery {row.delivery_id}",
                )

                session.add(line)
                row.invoiced_invoice_id = invoice.id

            created_numbers.append(number)

        await session.commit()

        return GenerateInvoicesResponse(
            invoices_created=len(created_numbers),
            invoice_numbers=created_numbers,
        )


@router.get(
    "/",
    response_model=list[InvoiceOut],
    dependencies=[Depends(_require_role("billing", "manager"))],
)
async def list_invoices():
    async with db_holder.SessionMaker() as session:
        result = await session.execute(
            select(Invoice)
            .options(selectinload(Invoice.lines))
            .order_by(Invoice.invoice_date.desc())
        )

        return result.scalars().all()


@router.get(
    "/{invoice_id}",
    response_model=InvoiceOut,
    dependencies=[Depends(_require_role("billing", "manager"))],
)
async def get_invoice(invoice_id: uuid.UUID):
    async with db_holder.SessionMaker() as session:
        result = await session.execute(
            select(Invoice)
            .options(selectinload(Invoice.lines))
            .where(Invoice.id == invoice_id)
        )

        invoice = result.scalar_one_or_none()

        if not invoice:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")

        return invoice


@router.post(
    "/{invoice_id}/pay",
    response_model=InvoiceOut,
    dependencies=[Depends(_require_role("billing", "manager"))],
)
async def mark_paid(invoice_id: uuid.UUID, body: MarkPaidRequest):
    async with db_holder.SessionMaker() as session:
        result = await session.execute(
            select(Invoice)
            .options(selectinload(Invoice.lines))
            .where(Invoice.id == invoice_id)
        )

        invoice = result.scalar_one_or_none()

        if not invoice:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")

        if invoice.status == InvoiceStatus.PAID:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invoice already paid")

        invoice.status = InvoiceStatus.PAID
        invoice.payment_date = body.payment_date or datetime.now(timezone.utc)

        await session.commit()
        await session.refresh(invoice)

        return invoice


@router.get(
    "/billable/",
    response_model=list[BillableDeliveryOut],
    dependencies=[Depends(_require_role("manager"))],
)
async def list_billable():
    async with db_holder.SessionMaker() as session:
        result = await session.execute(select(BillableDelivery))

        return result.scalars().all()