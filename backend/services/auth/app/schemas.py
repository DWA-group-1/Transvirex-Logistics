"""
Pydantic schemas for request/response validation in the auth service.
"""
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for user registration request body."""
    email: EmailStr
    password: str


class UserOut(BaseModel):
    """Schema for user data returned to the client (no password)."""
    id: int
    email: str
    is_active: bool

    class Config:
        from_attributes = True  # Allow ORM model → Pydantic conversion


class Token(BaseModel):
    """Schema for the JWT token response."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for data encoded inside the JWT payload."""
    email: str | None = None
