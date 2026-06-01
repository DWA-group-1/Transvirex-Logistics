from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DriverCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=200)
    phone: str | None = None


class DriverUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = None


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    auth_user_id: UUID
    email: str
    full_name: str
    phone: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DriverList(BaseModel):
    items: list[DriverOut]
    total: int
    limit: int
    offset: int
