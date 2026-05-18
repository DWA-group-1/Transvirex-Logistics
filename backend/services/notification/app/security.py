import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

_MAX_PW_BYTES = 72

def _prepare(plain_password: str) -> str:
    return plain_password.encode("utf-8")[:_MAX_PW_BYTES].decode("utf-8", errors="ignore")

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(_prepare(plain_password))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_prepare(plain_password), hashed_password)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None