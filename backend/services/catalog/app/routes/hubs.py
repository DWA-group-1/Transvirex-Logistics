import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from transvirex_common.database import get_db
from transvirex_common.deps import require_role

from ..models import Hub
from ..schemas import HubCreate, HubList, HubOut, HubUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hubs", tags=["hubs"])


@router.get("", response_model=HubList)
async def list_hubs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
    is_active: bool | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = select(Hub)
    count_query = select(func.count()).select_from(Hub)

    if is_active is not None:
        query = query.where(Hub.is_active == is_active)
        count_query = count_query.where(Hub.is_active == is_active)

    query = query.order_by(Hub.code).limit(limit).offset(offset)

    result = await db.execute(query)
    total = (await db.execute(count_query)).scalar_one()

    return HubList(
        items=[HubOut.model_validate(h) for h in result.scalars()],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/by-ids", response_model=list[HubOut])
async def list_hubs_by_ids(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher", "driver"))],
    ids: Annotated[str, Query(description="Comma-separated UUIDs")],
):
    try:
        uuid_list = [UUID(s.strip()) for s in ids.split(",") if s.strip()]
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid UUID in ids")

    if not uuid_list:
        return []

    result = await db.execute(select(Hub).where(Hub.id.in_(uuid_list)))
    return [HubOut.model_validate(h) for h in result.scalars()]


@router.get("/{hub_id}", response_model=HubOut)
async def get_hub(
    hub_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
):
    hub = await db.get(Hub, hub_id)
    if hub is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hub not found")
    return hub


@router.post("", response_model=HubOut, status_code=status.HTTP_201_CREATED)
async def create_hub(
    payload: HubCreate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager"))],
):
    existing = await db.execute(select(Hub).where(Hub.code == payload.code))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"A hub with code '{payload.code}' already exists",
        )

    hub = Hub(
        code=payload.code,
        name=payload.name,
        address=payload.address,
        capacity=payload.capacity,
    )
    db.add(hub)
    await db.commit()
    await db.refresh(hub)

    bus = request.app.state.bus
    await bus.publish(
        "catalog.events",
        "hub.created",
        {
            "hub_id": str(hub.id),
            "code": hub.code,
            "name": hub.name,
        },
    )

    return hub


@router.patch("/{hub_id}", response_model=HubOut)
async def update_hub(
    hub_id: UUID,
    payload: HubUpdate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager"))],
):
    hub = await db.get(Hub, hub_id)
    if hub is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hub not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return hub

    # If code is being changed, check uniqueness
    if "code" in update_data and update_data["code"] != hub.code:
        existing = await db.execute(select(Hub).where(Hub.code == update_data["code"]))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"A hub with code '{update_data['code']}' already exists",
            )

    for field, value in update_data.items():
        setattr(hub, field, value)

    await db.commit()
    await db.refresh(hub)

    bus = request.app.state.bus
    await bus.publish(
        "catalog.events",
        "hub.updated",
        {"hub_id": str(hub.id), "changes": update_data},
    )

    return hub


@router.delete("/{hub_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_hub(
    hub_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager"))],
):
    hub = await db.get(Hub, hub_id)
    if hub is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Hub not found")

    if not hub.is_active:
        return None

    hub.is_active = False
    await db.commit()

    bus = request.app.state.bus
    await bus.publish("catalog.events", "hub.deactivated", {"hub_id": str(hub.id)})

    return None
