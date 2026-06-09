from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .models import DeliveryStatus, IncidentStatus


class DeliveryCreate(BaseModel):
    hub_id: UUID
    customer_id: UUID
    pickup_address: str = Field(min_length=1)
    delivery_address: str = Field(min_length=1)
    city: str
    zip_code: str
    parcel_count: int = Field(default=1, ge=1)
    weight_kg: float | None = Field(default=None, ge=0)
    service_type: str
    priority: str = "Normal"
    expected_date: datetime | None = None
    notes: str | None = None


class DeliveryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reference: str
    hub_id: UUID
    customer_id: UUID
    assigned_driver_id: UUID | None
    pickup_address: str
    delivery_address: str
    city: str
    zip_code: str
    parcel_count: int
    weight_kg: float | None
    service_type: str
    priority: str
    status: DeliveryStatus
    expected_date: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class DeliveryEnriched(DeliveryOut):
    driver: dict | None = None
    hub: dict | None = None
    customer: dict | None = None
    has_open_incident: bool = False


class DeliveryList(BaseModel):
    items: list[DeliveryEnriched]
    total: int
    limit: int
    offset: int


class AssignDriverRequest(BaseModel):
    driver_id: UUID


class TrackingEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    delivery_id: UUID
    status: str
    location: str | None
    notes: str | None
    created_at: datetime


class TrackingNoteCreate(BaseModel):
    location: str | None = None
    notes: str | None = None


class IncidentCreate(BaseModel):
    type: str = Field(min_length=1)
    description: str = Field(min_length=1)
    severity: str = Field(default="medium", pattern="^(low|medium|high)$")


class IncidentResolve(BaseModel):
    resolution: str = Field(min_length=1)


class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    delivery_id: UUID
    type: str
    description: str
    severity: str
    status: IncidentStatus
    resolution: str | None
    created_at: datetime
    updated_at: datetime


class IncidentWithDelivery(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    delivery_id: UUID
    type: str
    description: str
    severity: str
    status: IncidentStatus
    resolution: str | None
    created_at: datetime
    updated_at: datetime
    delivery_address: str | None = None
    delivery_city: str | None = None
