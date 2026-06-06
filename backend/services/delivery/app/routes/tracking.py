from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from transvirex_common.database import get_db
from transvirex_common.deps import get_identity_headers, require_role

from ..clients import CatalogClient, get_catalog_client
from ..models import Delivery, TrackingEvent
from ..permissions import ensure_driver_owns
from ..schemas import TrackingEventOut, TrackingNoteCreate

router = APIRouter(prefix="/deliveries", tags=["tracking"])


async def _get_delivery_or_404(db: AsyncSession, delivery_id: UUID) -> Delivery:
    delivery = await db.get(Delivery, delivery_id)
    if delivery is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Delivery not found")
    return delivery


@router.get("/{delivery_id}/tracking", response_model=list[TrackingEventOut])
async def list_tracking(
    delivery_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
    order: str = Query("asc", pattern="^(asc|desc)$"),
):
    await _get_delivery_or_404(db, delivery_id)

    query = select(TrackingEvent).where(TrackingEvent.delivery_id == delivery_id)
    if order == "desc":
        query = query.order_by(TrackingEvent.created_at.desc())
    else:
        query = query.order_by(TrackingEvent.created_at.asc())

    result = await db.execute(query)
    return [TrackingEventOut.model_validate(t) for t in result.scalars()]


@router.post(
    "/{delivery_id}/tracking",
    response_model=TrackingEventOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_tracking_note(
    delivery_id: UUID,
    payload: TrackingNoteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    role: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
    x_user_id: Annotated[str, Header()],
):
    if not payload.location and not payload.notes:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Provide at least one of: location, notes",
        )

    delivery = await _get_delivery_or_404(db, delivery_id)

    await ensure_driver_owns(delivery, role, x_user_id, catalog, headers)

    event = TrackingEvent(
        delivery_id=delivery.id,
        status=delivery.status.value,  # note reflects current status
        location=payload.location,
        notes=payload.notes,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event
