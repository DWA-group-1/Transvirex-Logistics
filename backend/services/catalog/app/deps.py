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


def get_authorization_header(authorization: Annotated[str, Header()]) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid Authorization header"
        )
    return authorization[len("Bearer ") :]
