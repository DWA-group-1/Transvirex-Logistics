from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from .models import Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    must_change_password: bool = True
    role: Role


class UserOut(BaseModel):
    id: UUID
    email: str
    must_change_password: bool
    role: Role

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str
    confirm_password: str


class LoginResponse(TokenPair):
    must_change_password: bool
