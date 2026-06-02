import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import require_role
from ..models import Customer
from ..schemas import CustomerCreate, CustomerList, CustomerOut, CustomerUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=CustomerList)
async def list_customers(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "billing"))],
    is_active: bool | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = select(Customer)
    count_query = select(func.count()).select_from(Customer)

    if is_active is not None:
        query = query.where(Customer.is_active == is_active)
        count_query = count_query.where(Customer.is_active == is_active)

    query = query.order_by(Customer.name).limit(limit).offset(offset)

    result = await db.execute(query)
    total = (await db.execute(count_query)).scalar_one()

    return CustomerList(
        items=[CustomerOut.model_validate(c) for c in result.scalars()],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/by-ids", response_model=list[CustomerOut])
async def list_customers_by_ids(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "billing"))],
    ids: Annotated[str, Query(description="Comma-separated UUIDs")],
):
    try:
        uuid_list = [UUID(s.strip()) for s in ids.split(",") if s.strip()]
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid UUID in ids")

    if not uuid_list:
        return []

    result = await db.execute(select(Customer).where(Customer.id.in_(uuid_list)))
    return [CustomerOut.model_validate(c) for c in result.scalars()]


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "billing"))],
):
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found")
    return customer


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
):
    customer = Customer(
        name=payload.name,
        contact_name=payload.contact_name,
        email=payload.email,
        address=payload.address,
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)

    bus = request.app.state.bus
    await bus.publish(
        "catalog.events",
        "customer.created",
        {"customer_id": str(customer.id), "name": customer.name},
    )

    return customer


@router.patch("/{customer_id}", response_model=CustomerOut)
async def update_customer(
    customer_id: UUID,
    payload: CustomerUpdate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
):
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return customer

    for field, value in update_data.items():
        setattr(customer, field, value)

    await db.commit()
    await db.refresh(customer)

    bus = request.app.state.bus
    await bus.publish(
        "catalog.events",
        "customer.updated",
        {"customer_id": str(customer.id), "changes": update_data},
    )

    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_customer(
    customer_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager"))],
):
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found")

    if not customer.is_active:
        return None

    customer.is_active = False
    await db.commit()

    bus = request.app.state.bus
    await bus.publish(
        "catalog.events", "customer.deactivated", {"customer_id": str(customer.id)}
    )

    return None
