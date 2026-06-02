from typing import Annotated

from fastapi import Header, HTTPException, status


def require_role(*allowed_roles: str):
    def _check(x_user_role: Annotated[str, Header()]) -> str:
        if x_user_role not in allowed_roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, f"role {x_user_role} not allowed"
            )
        return x_user_role

    return _check


def get_identity_header(
    x_user_id: Annotated[str, Header()], x_user_role: Annotated[str, Header()]
) -> dict[str, str]:
    return {"X-User-Id": x_user_id, "X-User-Role": x_user_role}
