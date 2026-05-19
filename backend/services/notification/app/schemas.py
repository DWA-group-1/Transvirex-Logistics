from datetime import datetime

from pydantic import BaseModel


class NotificationCreate(BaseModel):
    target_user_id: int | None = None
    target_role: str | None = None
    type: str
    title: str
    message: str
    payload: str | None = None


class NotificationOut(BaseModel):
    id: int
    target_user_id: int | None
    target_role: str | None
    type: str
    title: str
    message: str
    payload: str | None
    is_read: bool
    sender_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class MarkReadRequest(BaseModel):
    notification_ids: list[int]

