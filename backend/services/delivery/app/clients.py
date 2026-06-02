import logging
from uuid import UUID

import httpx

from .config import settings

logger = logging.getLogger(__name__)


class CatalogClient:
    def __init__(self, base_url: str | None = None):
        self._client = httpx.AsyncClient(
            base_url=base_url or settings.catalog_internal_url, timeout=5.0
        )

    async def _by_ids(
        self, path: str, ids: set[UUID], headers: dict[str, str]
    ) -> list[dict]:
        if not ids:
            return []
        resp = await self._client.get(
            path,
            params={"ids": ",".join(str(i) for i in ids)},
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def get_drivers_by_ids(
        self, ids: set[UUID], *, headers: dict[str, str]
    ) -> list[dict]:
        return await self._by_ids("/drivers/by-ids", ids, headers)

    async def get_hubs_by_ids(
        self, ids: set[UUID], *, headers: dict[str, str]
    ) -> list[dict]:
        return await self._by_ids("/hubs/by-ids", ids, headers)

    async def get_customers_by_ids(
        self, ids: set[UUID], *, headers: dict[str, str]
    ) -> list[dict]:
        return await self._by_ids("/customers/by-ids", ids, headers)

    async def get_driver_by_auth_user(
        self, auth_user_id: str, *, headers: dict[str, str]
    ) -> dict:
        resp = await self._client.get(
            f"/drivers/by-auth-user/{auth_user_id}",
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def close(self) -> None:
        await self._client.aclose()


catalog_client: CatalogClient | None = None


def get_catalog_client() -> CatalogClient:
    if catalog_client is None:
        raise RuntimeError("CatalogClient not initialized — check lifespan setup")
    return catalog_client
