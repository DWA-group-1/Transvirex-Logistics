import httpx
import jwt
from fastapi import HTTPException, status

from .config import settings


def extract_token(authorization_header: str | None) -> str:
    if not authorization_header:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing Authorization header")
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Malformed Authorization header")
    return parts[1]


def verify_jwt(token: str) -> dict:
    try:
        claims = jwt.decode(
            token,
            settings.public_key,
            algorithms=["RS256"],           
        )                                   
        return claims
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")