import jwt

from .config import settings


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token, settings.public_key, algorithms=[settings.jwt_algorithm]
        )
    except jwt.InvalidTokenError:
        return None
