import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import require_role
from ..models import Delivery, Incident, IncidentStatus
from ..schemas import IncidentCreate, IncidentOut, IncidentResolve

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
