import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from transvirex_common.database import get_db
from transvirex_common.deps import require_role

from ..models import Delivery, Incident, IncidentStatus
from ..schemas import IncidentCreate, IncidentOut, IncidentResolve, IncidentWithDelivery

logger = logging.getLogger(__name__)
router = APIRouter(tags=["incidents"])


async def _publish(request: Request, event_type: str, data: dict) -> None:
    await request.app.state.bus.publish("delivery.events", event_type, data)


@router.post(
    "/deliveries/{delivery_id}/incidents",
    response_model=IncidentOut,
    status_code=status.HTTP_201_CREATED,
)
async def declare_incident(
    delivery_id: UUID,
    payload: IncidentCreate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
):
    delivery = await db.get(Delivery, delivery_id)
    if delivery is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Delivery not found")

    incident = Incident(
        delivery_id=delivery_id,
        type=payload.type,
        description=payload.description,
        severity=payload.severity,
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)

    await _publish(
        request,
        "incident.declared",
        {
            "incident_id": str(incident.id),
            "delivery_id": str(delivery_id),
            "reference": delivery.reference,
            "type": incident.type,
            "severity": incident.severity,
        },
    )

    return incident


@router.get("/deliveries/{delivery_id}/incidents", response_model=list[IncidentOut])
async def list_incidents(
    delivery_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
):
    result = await db.execute(
        select(Incident)
        .where(Incident.delivery_id == delivery_id)
        .order_by(Incident.created_at.desc())
    )
    return [IncidentOut.model_validate(i) for i in result.scalars()]


@router.get("/incidents/{incident_id}", response_model=IncidentOut)
async def get_incident(
    incident_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
):
    incident = await db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Incident not found")
    return incident


@router.get("/incidents", response_model=list[IncidentWithDelivery])
async def list_all_incidents(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
    status_filter: IncidentStatus | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = select(Incident, Delivery).join(
        Delivery, Delivery.id == Incident.delivery_id
    )
    if status_filter is not None:
        query = query.where(Incident.status == status_filter)
    query = query.order_by(Incident.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    rows = result.all()

    out: list[IncidentWithDelivery] = []
    for incident, delivery in rows:
        item = IncidentWithDelivery.model_validate(incident)
        item.delivery_address = delivery.delivery_address
        item.delivery_city = delivery.city
        out.append(item)
    return out


@router.post("/incidents/{incident_id}/resolve", response_model=IncidentOut)
async def resolve_incident(
    incident_id: UUID,
    payload: IncidentResolve,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
):
    incident = await db.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Incident not found")

    if incident.status == IncidentStatus.RESOLVED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Incident already resolved")

    incident.status = IncidentStatus.RESOLVED
    incident.resolution = payload.resolution
    await db.commit()
    await db.refresh(incident)

    await _publish(
        request,
        "incident.resolved",
        {
            "incident_id": str(incident.id),
            "delivery_id": str(incident.delivery_id),
        },
    )

    return incident
