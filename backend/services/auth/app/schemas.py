from uuid import UUID

from pydantic import BaseModel, EmailStr

from .models import Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Role


class UserOut(BaseModel):
    id: UUID
    email: str
    role: Role

    class Config:
        from_attributes = True  # Allow ORM model → Pydantic conversion


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None
