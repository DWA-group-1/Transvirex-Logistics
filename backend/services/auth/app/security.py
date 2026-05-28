from datetime import datetime, timedelta, timezone

import secrets
import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

_MAX_PW_BYTES = 72

def _prepare(plain: str) -> str:
    return plain.encode("utf-8")[:_MAX_PW_BYTES].decode("utf-8", errors="ignore")

def hash_password(plain: str) -> str:
    return pwd_context.hash(_prepare(plain))

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prepare(plain), hashed)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    return jwt.encode(payload, settings.private_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            settings.private_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.InvalidTokenError:
        return None

REFRESH_TOKEN_EXPIRE_DAYS = 30

def create_refresh_token() -> str:
    """Génère un token opaque aléatoire (pas un JWT)."""
    return secrets.token_urlsafe(64)

def get_refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)