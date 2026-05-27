from datetime import datetime, timedelta, timezone

import secrets
import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

_MAX_PW_BYTES = 72


def _prepare(plain_password: str) -> str:
    return plain_password.encode("utf-8")[:_MAX_PW_BYTES].decode(
        "utf-8", errors="ignore"
    )


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(_prepare(plain_password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_prepare(plain_password), hashed_password)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.InvalidTokenError:
        return None

REFRESH_TOKEN_EXPIRE_DAYS = 30

def create_refresh_token() -> str:
    """Génère un token opaque aléatoire (pas un JWT)."""
    return secrets.token_urlsafe(64)

def get_refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)