import logging
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from transvirex_common.database import get_db
from transvirex_common.deps import get_identity_headers, require_role

from ..clients import CatalogClient, get_catalog_client
from ..models import Delivery, DeliveryStatus, Incident, IncidentStatus, TrackingEvent
from ..permissions import ensure_driver_owns, resolve_acting_driver_id
from ..schemas import (
    AssignDriverRequest,
    DeliveryCreate,
    DeliveryEnriched,
    DeliveryList,
    DeliveryOut,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/deliveries", tags=["deliveries"])

TERMINAL = {DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED}


async def _write_tracking(
    db: AsyncSession,
    delivery_id: UUID,
    status_value: str,
    location: str | None = None,
    notes: str | None = None,
) -> None:
    db.add(
        TrackingEvent(
            delivery_id=delivery_id,
            status=status_value,
            location=location,
            notes=notes,
        )
    )


async def _get_or_404(db: AsyncSession, delivery_id: UUID) -> Delivery:
    delivery = await db.get(Delivery, delivery_id)
    if delivery is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Delivery not found")
    return delivery


async def _deliveries_with_open_incidents(
    db: AsyncSession, delivery_ids: set[UUID]
) -> set[UUID]:
    if not delivery_ids:
        return set()
    result = await db.execute(
        select(Incident.delivery_id)
        .where(
            Incident.delivery_id.in_(delivery_ids),
            Incident.status == IncidentStatus.OPEN,
        )
        .distinct()
    )
    return set(result.scalars())


async def _publish(request: Request, event_type: str, data: dict) -> None:
    await request.app.state.bus.publish("delivery.events", event_type, data)


async def _enrich(
    deliveries: list[Delivery],
    catalog: CatalogClient,
    headers: dict[str, str],
    db: AsyncSession,
) -> list[DeliveryEnriched]:
    driver_ids = {d.assigned_driver_id for d in deliveries if d.assigned_driver_id}
    hub_ids = {d.hub_id for d in deliveries}
    customer_ids = {d.customer_id for d in deliveries}
    delivery_ids = {d.id for d in deliveries}

    flagged = await _deliveries_with_open_incidents(db, delivery_ids)

    try:
        drivers = await catalog.get_drivers_by_ids(driver_ids, headers=headers)
        hubs = await catalog.get_hubs_by_ids(hub_ids, headers=headers)
        customers = await catalog.get_customers_by_ids(customer_ids, headers=headers)
    except httpx.HTTPStatusError:
        logger.exception("Catalog enrichment failed")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "Failed to enrich from Catalog"
        )

    driver_map = {d["id"]: d for d in drivers}
    hub_map = {h["id"]: h for h in hubs}
    customer_map = {c["id"]: c for c in customers}

    enriched: list[DeliveryEnriched] = []
    for d in deliveries:
        item = DeliveryEnriched.model_validate(d)
        item.driver = (
            driver_map.get(str(d.assigned_driver_id)) if d.assigned_driver_id else None
        )
        item.hub = hub_map.get(str(d.hub_id))
        item.customer = customer_map.get(str(d.customer_id))
        item.has_open_incident = d.id in flagged
        enriched.append(item)
    return enriched


@router.get("", response_model=DeliveryList)
async def list_deliveries(
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
    status_filter: DeliveryStatus | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = select(Delivery)
    count_query = select(func.count()).select_from(Delivery)
    if status_filter is not None:
        query = query.where(Delivery.status == status_filter)
        count_query = count_query.where(Delivery.status == status_filter)

    query = query.order_by(Delivery.created_at.desc()).limit(limit).offset(offset)
    rows = list((await db.execute(query)).scalars())
    total = (await db.execute(count_query)).scalar_one()

    return DeliveryList(
        items=await _enrich(rows, catalog, headers, db),
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/mine", response_model=DeliveryList)
async def list_my_deliveries(
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    role: Annotated[str, Depends(require_role("driver", "manager", "dispatcher"))],
    x_user_id: Annotated[str, Header()],
    status_filter: DeliveryStatus | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    # Resolve which driver is asking
    driver_id = await resolve_acting_driver_id(catalog, headers, x_user_id)

    query = select(Delivery).where(Delivery.assigned_driver_id == driver_id)
    count_query = (
        select(func.count())
        .select_from(Delivery)
        .where(Delivery.assigned_driver_id == driver_id)
    )
    if status_filter is not None:
        query = query.where(Delivery.status == status_filter)
        count_query = count_query.where(Delivery.status == status_filter)

    query = query.order_by(Delivery.created_at.desc()).limit(limit).offset(offset)
    rows = list((await db.execute(query)).scalars())
    total = (await db.execute(count_query)).scalar_one()

    return DeliveryList(
        items=await _enrich(rows, catalog, headers, db),
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{delivery_id}", response_model=DeliveryEnriched)
async def get_delivery(
    delivery_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
):
    delivery = await _get_or_404(db, delivery_id)
    enriched = await _enrich([delivery], catalog, headers, db)
    return enriched[0]


@router.post("", response_model=DeliveryOut, status_code=status.HTTP_201_CREATED)
async def create_delivery(
    payload: DeliveryCreate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
    assigned_driver_id: UUID | None = None,
):
    starts_assigned = assigned_driver_id is not None
    delivery = Delivery(
        hub_id=payload.hub_id,
        customer_id=payload.customer_id,
        assigned_driver_id=assigned_driver_id,
        pickup_address=payload.pickup_address,
        delivery_address=payload.delivery_address,
        city=payload.city,
        zip_code=payload.zip_code,
        parcel_count=payload.parcel_count,
        weight_kg=payload.weight_kg,
        service_type=payload.service_type,
        priority=payload.priority,
        expected_date=payload.expected_date,
        notes=payload.notes,
        status=DeliveryStatus.ASSIGNED if starts_assigned else DeliveryStatus.CREATED,
    )
    db.add(delivery)
    await db.flush()  # get delivery.id before writing tracking

    await _write_tracking(
        db, delivery.id, delivery.status.value, notes="Delivery created"
    )
    if starts_assigned:
        await _write_tracking(
            db,
            delivery.id,
            DeliveryStatus.ASSIGNED.value,
            notes="Driver assigned at creation",
        )

    await db.commit()
    await db.refresh(delivery)

    await _publish(
        request,
        "delivery.created",
        {
            "delivery_id": str(delivery.id),
            "customer_id": str(delivery.customer_id),
            "hub_id": str(delivery.hub_id),
        },
    )
    if starts_assigned:
        auth_user_id = None
        try:
            drivers = await catalog.get_drivers_by_ids(
                {assigned_driver_id}, headers=headers
            )
            if drivers:
                auth_user_id = drivers[0]["auth_user_id"]
        except httpx.HTTPStatusError:
            logger.warning(
                "Could not resolve auth_user_id for driver %s", assigned_driver_id
            )

        await _publish(
            request,
            "delivery.assigned",
            {
                "delivery_id": str(delivery.id),
                "driver_id": str(delivery.assigned_driver_id),
                "driver_auth_user_id": auth_user_id,
            },
        )

    return delivery


@router.post("/{delivery_id}/assign", response_model=DeliveryOut)
async def assign_driver(
    delivery_id: UUID,
    body: AssignDriverRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
):
    delivery = await _get_or_404(db, delivery_id)
    if delivery.status in TERMINAL:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot assign a delivery in status '{delivery.status.value}'",
        )

    delivery.assigned_driver_id = body.driver_id
    if delivery.status == DeliveryStatus.CREATED:
        delivery.status = DeliveryStatus.ASSIGNED

    await _write_tracking(
        db, delivery.id, DeliveryStatus.ASSIGNED.value, notes="Driver assigned"
    )
    await db.commit()
    await db.refresh(delivery)

    auth_user_id = None
    try:
        drivers = await catalog.get_drivers_by_ids({body.driver_id}, headers=headers)
        if drivers:
            auth_user_id = drivers[0]["auth_user_id"]
    except httpx.HTTPStatusError:
        logger.warning("Could not resolve auth_user_id for driver %s", body.driver_id)

    await _publish(
        request,
        "delivery.assigned",
        {
            "delivery_id": str(delivery.id),
            "driver_id": str(delivery.assigned_driver_id),
            "driver_auth_user_id": auth_user_id,
        },
    )
    return delivery


async def _transition(
    *,
    delivery_id: UUID,
    expected_from: DeliveryStatus,
    to: DeliveryStatus,
    event_type: str,
    request: Request,
    db: AsyncSession,
    catalog: CatalogClient,
    headers: dict[str, str],
    role: str,
    x_user_id: str,
    location: str | None = None,
) -> Delivery:
    delivery = await _get_or_404(db, delivery_id)

    if delivery.status != expected_from:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot move from '{delivery.status.value}' to '{to.value}'",
        )

    await ensure_driver_owns(delivery, role, x_user_id, catalog, headers)

    delivery.status = to

    await _write_tracking(
        db,
        delivery.id,
        to.value,
        location=location,
    )

    await db.commit()
    await db.refresh(delivery)

    await _publish(
        request,
        event_type,
        {
            "delivery_id": str(delivery.id),
            "customer_id": str(delivery.customer_id),
            "driver_id": (
                str(delivery.assigned_driver_id)
                if delivery.assigned_driver_id
                else None
            ),
            "completed_at": (
                delivery.updated_at.isoformat()
                if delivery.updated_at
                else None
            ),
            "service_type": delivery.service_type,
            "priority": delivery.priority,
            "weight_kg": delivery.weight_kg,
            "parcel_count": delivery.parcel_count,
        },
    )

    return delivery


@router.post("/{delivery_id}/pickup", response_model=DeliveryOut)
async def pickup(
    delivery_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    role: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
    x_user_id: Annotated[str, Header()],
    location: str | None = None,
):
    return await _transition(
        delivery_id=delivery_id,
        expected_from=DeliveryStatus.ASSIGNED,
        to=DeliveryStatus.PICKED_UP,
        event_type="delivery.picked_up",
        request=request,
        db=db,
        catalog=catalog,
        headers=headers,
        role=role,
        x_user_id=x_user_id,
        location=location,
    )


@router.post("/{delivery_id}/depart", response_model=DeliveryOut)
async def depart(
    delivery_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    role: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
    x_user_id: Annotated[str, Header()],
    location: str | None = None,
):
    return await _transition(
        delivery_id=delivery_id,
        expected_from=DeliveryStatus.PICKED_UP,
        to=DeliveryStatus.IN_TRANSIT,
        event_type="delivery.in_transit",
        request=request,
        db=db,
        catalog=catalog,
        headers=headers,
        role=role,
        x_user_id=x_user_id,
        location=location,
    )


@router.post("/{delivery_id}/deliver", response_model=DeliveryOut)
async def deliver(
    delivery_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    catalog: Annotated[CatalogClient, Depends(get_catalog_client)],
    headers: Annotated[dict[str, str], Depends(get_identity_headers)],
    role: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
    x_user_id: Annotated[str, Header()],
    location: str | None = None,
):
    return await _transition(
        delivery_id=delivery_id,
        expected_from=DeliveryStatus.IN_TRANSIT,
        to=DeliveryStatus.DELIVERED,
        event_type="delivery.completed",
        request=request,
        db=db,
        catalog=catalog,
        headers=headers,
        role=role,
        x_user_id=x_user_id,
        location=location,
    )


@router.post("/{delivery_id}/cancel", response_model=DeliveryOut)
async def cancel(
    delivery_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
):
    delivery = await _get_or_404(db, delivery_id)
    if delivery.status in TERMINAL:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot cancel a delivery in status '{delivery.status.value}'",
        )
    delivery.status = DeliveryStatus.CANCELLED
    await _write_tracking(
        db, delivery.id, DeliveryStatus.CANCELLED.value, notes="Delivery cancelled"
    )
    await db.commit()
    await db.refresh(delivery)

    await _publish(request, "delivery.cancelled", {"delivery_id": str(delivery.id)})
    return delivery
