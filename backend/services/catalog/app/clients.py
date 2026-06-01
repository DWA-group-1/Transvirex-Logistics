import logging
from uuid import UUID

import httpx

from .config import settings

logger = logging.getLogger(__name__)


class AuthClient:
    def __init__(self, base_url: str | None = None):
        self._base_url = base_url or settings.auth_internal_url
        self._client = httpx.AsyncClient(base_url=self._base_url, timeout=5.0)

    async def register_user(self, *, email: str, password: str, jwt: str) -> UUID:
        response = await self._client.post(
            "/register",
            json={"email": email, "password": password, "role": "driver"},
            headers={"Authorization": f"Bearer {jwt}"},
        )
        response.raise_for_status()
        data = response.json()
        return UUID(data["id"])

    async def delete_user(self, user_id: UUID, *, jwt: str) -> None:
        response = await self._client.delete(
            f"/users/{user_id}",
            headers={"Authorization": f"Bearer {jwt}"},
        )
        response.raise_for_status()

    async def close(self) -> None:
        await self._client.aclose()


# Module-level singleton, instantiated at startup
auth_client: AuthClient | None = None


def get_auth_client() -> AuthClient:
    if auth_client is None:
        raise RuntimeError("AuthClient not initialized — check lifespan setup")
    return auth_client
