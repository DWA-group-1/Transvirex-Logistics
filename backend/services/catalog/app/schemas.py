from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DriverCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = None
    hub_id: UUID | None = None


class DriverUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = None
    hub_id: UUID | None = None


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    auth_user_id: UUID
    email: str
    first_name: str
    last_name: str
    phone: str | None
    hub_id: UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DriverList(BaseModel):
    items: list[DriverOut]
    total: int
    limit: int
    offset: int


class HubCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1)
    capacity: int | None = Field(default=None, ge=0)


class HubUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=20)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = Field(default=None, min_length=1)
    capacity: int | None = Field(default=None, ge=0)


class HubOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    address: str
    capacity: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class HubList(BaseModel):
    items: list[HubOut]
    total: int
    limit: int
    offset: int


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    contact_name: str | None = Field(default=None, max_length=200)
    email: str | None = None
    address: str = Field(min_length=1)


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    contact_name: str | None = Field(default=None, max_length=200)
    email: str | None = None
    address: str | None = Field(default=None, min_length=1)


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    contact_name: str | None
    email: str | None
    address: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CustomerList(BaseModel):
    items: list[CustomerOut]
    total: int
    limit: int
    offset: int
