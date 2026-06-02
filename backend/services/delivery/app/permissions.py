from uuid import UUID

import httpx
from fastapi import HTTPException, status

from .clients import CatalogClient
from .models import Delivery


async def resolve_acting_driver_id(
    catalog: CatalogClient, headers: dict[str, str], auth_user_id: str
) -> UUID:
    try:
        driver = await catalog.get_driver_by_auth_user(auth_user_id, headers=headers)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "No driver record for this user"
            )
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Catalog lookup failed")
    return UUID(driver["id"])


async def ensure_driver_owns(
    delivery: Delivery,
    role: str,
    auth_user_id: str,
    catalog: CatalogClient,
    headers: dict[str, str],
) -> None:
    if role == "driver":
        acting = await resolve_acting_driver_id(catalog, headers, auth_user_id)
        if delivery.assigned_driver_id != acting:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "You can only act on deliveries assigned to you",
            )
