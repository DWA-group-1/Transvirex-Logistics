"""
Tool definitions for the AI agent.
Each tool calls the gateway on behalf of the authenticated user (bearer JWT forwarded).
"""

import httpx

from .config import settings

Headers = dict[str, str]


def _auth(jwt: str) -> Headers:
    return {"Authorization": f"Bearer {jwt}"}


async def _get(path: str, jwt: str, params: dict | None = None) -> dict | list:
    url = f"{settings.gateway_url}{path}"
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        r = await client.get(url, headers=_auth(jwt), params=params or {})
        r.raise_for_status()
        return r.json()


# ── Delivery tools ───────────────────────────────────────────────────────────


async def get_my_deliveries(
    jwt: str,
    status_filter: str | None = None,
    limit: int = 10,
    offset: int = 0,
) -> dict:
    """
    List deliveries assigned to the current driver.
    Allowed roles: driver, manager, dispatcher.
    status_filter: one of created|assigned|picked_up|in_transit|delivered|cancelled
    """
    params: dict = {"limit": limit, "offset": offset}
    if status_filter:
        params["status"] = status_filter
    return await _get("/delivery/deliveries/mine", jwt, params)


async def list_deliveries(
    jwt: str,
    status_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """
    List all deliveries (manager / dispatcher only).
    status_filter: one of created|assigned|picked_up|in_transit|delivered|cancelled
    """
    params: dict = {"limit": limit, "offset": offset}
    if status_filter:
        params["status"] = status_filter
    return await _get("/delivery/deliveries", jwt, params)


async def get_delivery(jwt: str, delivery_id: str) -> dict:
    """Get full details (enriched) for a single delivery by its UUID."""
    return await _get(f"/delivery/deliveries/{delivery_id}", jwt)


async def get_delivery_tracking(
    jwt: str, delivery_id: str, order: str = "asc"
) -> list:
    """Return the tracking event history for a delivery."""
    return await _get(
        f"/delivery/deliveries/{delivery_id}/tracking", jwt, params={"order": order}
    )


# ── Incident tools ───────────────────────────────────────────────────────────


async def list_incidents(
    jwt: str,
    status_filter: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list:
    """
    List all incidents (manager / dispatcher only).
    status_filter: open | resolved
    """
    params: dict = {"limit": limit, "offset": offset}
    if status_filter:
        params["status"] = status_filter
    return await _get("/delivery/incidents", jwt, params)


async def list_delivery_incidents(jwt: str, delivery_id: str) -> list:
    """List incidents declared for a specific delivery."""
    return await _get(f"/delivery/deliveries/{delivery_id}/incidents", jwt)


# ── Catalogue tools ──────────────────────────────────────────────────────────


async def list_drivers(
    jwt: str,
    is_active: bool | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """List drivers (manager / dispatcher only)."""
    params: dict = {"limit": limit, "offset": offset}
    if is_active is not None:
        params["is_active"] = str(is_active).lower()
    return await _get("/catalog/drivers", jwt, params)


async def list_hubs(
    jwt: str,
    is_active: bool | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """List logistics hubs (manager / dispatcher only)."""
    params: dict = {"limit": limit, "offset": offset}
    if is_active is not None:
        params["is_active"] = str(is_active).lower()
    return await _get("/catalog/hubs", jwt, params)


async def list_customers(
    jwt: str,
    is_active: bool | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """List customers (manager / dispatcher / billing only)."""
    params: dict = {"limit": limit, "offset": offset}
    if is_active is not None:
        params["is_active"] = str(is_active).lower()
    return await _get("/catalog/customers", jwt, params)


# ── Notifications ────────────────────────────────────────────────────────────


async def list_notifications(jwt: str, unread_only: bool = False) -> list:
    """Return notifications for the current user."""
    return await _get(
        "/notification/notifications", jwt, params={"unread_only": str(unread_only).lower()}
    )


# ── Tool registry ─────────────────────────────────────────────────────────────

TOOLS: dict[str, dict] = {
    "get_my_deliveries": {
        "fn": get_my_deliveries,
        "description": (
            "List deliveries assigned to the current driver. "
            "Params: status_filter (optional, one of: assigned|picked_up|in_transit|delivered|cancelled), limit, offset."
        ),
        "allowed_roles": {"driver", "manager", "dispatcher"},
        "params": ["status_filter", "limit", "offset"],
    },
    "list_deliveries": {
        "fn": list_deliveries,
        "description": (
            "List ALL deliveries on the platform. "
            "Params: status_filter (optional, one of: created|assigned|picked_up|in_transit|delivered|cancelled), limit, offset."
        ),
        "allowed_roles": {"manager", "dispatcher"},
        "params": ["status_filter", "limit", "offset"],
    },
    "get_delivery": {
        "fn": get_delivery,
        "description": "Get full enriched details for one delivery. Params: delivery_id (UUID string).",
        "allowed_roles": {"manager", "dispatcher", "driver"},
        "params": ["delivery_id"],
    },
    "get_delivery_tracking": {
        "fn": get_delivery_tracking,
        "description": "Get tracking history for a delivery. Params: delivery_id (UUID string), order (asc|desc).",
        "allowed_roles": {"manager", "dispatcher", "driver"},
        "params": ["delivery_id", "order"],
    },
    "list_incidents": {
        "fn": list_incidents,
        "description": "List all incidents on the platform. Params: status_filter (open|resolved), limit, offset.",
        "allowed_roles": {"manager", "dispatcher"},
        "params": ["status_filter", "limit", "offset"],
    },
    "list_delivery_incidents": {
        "fn": list_delivery_incidents,
        "description": "List incidents for a specific delivery. Params: delivery_id (UUID string).",
        "allowed_roles": {"manager", "dispatcher", "driver"},
        "params": ["delivery_id"],
    },
    "list_drivers": {
        "fn": list_drivers,
        "description": "List drivers. Params: is_active (true|false), limit, offset.",
        "allowed_roles": {"manager", "dispatcher"},
        "params": ["is_active", "limit", "offset"],
    },
    "list_hubs": {
        "fn": list_hubs,
        "description": "List logistics hubs. Params: is_active (true|false), limit, offset.",
        "allowed_roles": {"manager", "dispatcher"},
        "params": ["is_active", "limit", "offset"],
    },
    "list_customers": {
        "fn": list_customers,
        "description": "List customers. Params: is_active (true|false), limit, offset.",
        "allowed_roles": {"manager", "dispatcher", "billing"},
        "params": ["is_active", "limit", "offset"],
    },
    "list_notifications": {
        "fn": list_notifications,
        "description": "List notifications for the current user. Params: unread_only (true|false).",
        "allowed_roles": {"manager", "dispatcher", "driver", "billing"},
        "params": ["unread_only"],
    },
}