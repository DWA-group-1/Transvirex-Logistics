"""
Security utilities: password hashing, JWT creation and verification.
"""

import os
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# Read configuration from environment
JWT_SECRET = settings.jwt_secret
JWT_ALGORITHM = settings.jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

# bcrypt context for password hashing
# truncate_error=False suppresses the passlib/bcrypt 4.x version-detection warning
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# bcrypt silently truncates passwords longer than 72 bytes, which is a security
# risk. We truncate explicitly so the hash and verify use the same bytes.
_MAX_PW_BYTES = 72


def _prepare(plain_password: str) -> str:
    """Encode to UTF-8, truncate to 72 bytes, return as str for passlib."""
    encoded = plain_password.encode("utf-8")[:_MAX_PW_BYTES]
    return encoded.decode("utf-8", errors="ignore")


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt (safe 72-byte truncation)."""
    return pwd_context.hash(_prepare(plain_password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against a bcrypt hash."""
    return pwd_context.verify(_prepare(plain_password), hashed_password)


def create_access_token(data: dict) -> str:
    """
    Create a signed JWT token.
    Adds an 'exp' claim automatically based on ACCESS_TOKEN_EXPIRE_MINUTES.
    """
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decode and verify a JWT token.
    Returns the payload dict on success, None on failure.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
