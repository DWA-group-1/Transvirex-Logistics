import logging
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..clients import AuthClient, get_auth_client
from ..database import get_db
from ..deps import get_authorization_header, require_role
from ..models import Driver
from ..schemas import DriverCreate, DriverList, DriverOut, DriverUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("", response_model=DriverList)
async def list_drivers(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
    is_active: bool | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = select(Driver)
    count_query = select(func.count()).select_from(Driver)

    if is_active is not None:
        query = query.where(Driver.is_active == is_active)
        count_query = count_query.where(Driver.is_active == is_active)

    query = query.order_by(Driver.full_name).limit(limit).offset(offset)

    result = await db.execute(query)
    total = (await db.execute(count_query)).scalar_one()

    return DriverList(
        items=list(result.scalars()),
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/by-ids", response_model=DriverList)
async def get_driver_by_ids(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
    ids: Annotated[str, Query(description="Comma-separated UUIDs")],
):
    try:
        uuid_list = [UUID(s.strip()) for s in ids.split(",") if s.strip()]
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid UUID in ids")

    if not uuid_list:
        return []

    result = await db.execute(select(Driver).where(Driver.id.in_(uuid_list)))
    return list(result.scalars())


@router.get("/{driver_id}", response_model=DriverOut)
async def get_driver(
    driver_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager", "dispatcher"))],
):
    driver = await db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")
    return driver


@router.post("", response_model=DriverOut, status_code=status.HTTP_201_CREATED)
async def create_driver(
    payload: DriverCreate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    auth: Annotated[AuthClient, Depends(get_auth_client)],
    jwt: Annotated[str, Depends(get_authorization_header)],
    _: Annotated[str, Depends(require_role("manager"))],
):
    try:
        auth_user_id = await auth.register_user(
            email=payload.email,
            password=payload.password,
            jwt=jwt,
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == status.HTTP_409_CONFLICT:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "An account with this email already exist",
            )
        logger.exception("Auth: register_user failed")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "Failed to create user account"
        )

    driver = Driver(
        auth_user_id=auth_user_id,
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
    )
    try:
        db.add(driver)
        await db.commit()
        await db.refresh(driver)
    except Exception:
        logger.exception(
            "Catalog: Driver insert failed for auth_user_id=%s, rolling back Auth user",
            auth_user_id,
        )
        await db.rollback()
        try:
            await auth.delete_user(auth_user_id, jwt=jwt)
        except Exception:
            logger.exception(
                "Auth rollback failed for auth_user_id=%s. Manual cleanup required.",
                auth_user_id,
            )
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to create driver"
        )

    bus = request.app.state.bus
    await bus.publish(
        "catalog.events",
        "driver.created",
        {
            "driver_id": str(driver.id),
            "auth_user_id": str(driver.auth_user_id),
            "email": driver.email,
            "full_name": driver.full_name,
        },
    )
    return driver


@router.patch("/{driver_id}", response_model=DriverOut)
async def update_driver(
    driver_id: UUID,
    payload: DriverUpdate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager"))],
):
    driver = await db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return driver

    for field, value in update_data.items():
        setattr(driver, field, value)

    await db.commit()
    await db.refresh(driver)

    bus = request.app.state.bus
    await bus.publish(
        "catalog.events",
        "driver.updated",
        {
            "driver_id": str(driver.id),
            "changes": update_data,
        },
    )

    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_driver(
    driver_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[str, Depends(require_role("manager"))],
):
    driver = await db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")

    if not driver.is_active:
        return None

    driver.is_active = False
    await db.commit()

    bus = request.app.state.bus
    await bus.publish(
        "catalog.events", "driver.deactivated", {"driver_id": str(driver.id)}
    )

    return None
