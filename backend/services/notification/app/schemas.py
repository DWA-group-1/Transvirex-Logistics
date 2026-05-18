from datetime import datetime
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    """
    Payload pour POST /notifications.
    Renseigner target_user_id OU target_role (ou les deux).
    """
    target_user_id: int | None = None   # notif ciblée utilisateur
    target_role: str | None = None      # broadcast par rôle
    type: str                           # ex: "nouvelle_mission", "incident_critique"
    title: str
    message: str
    payload: str | None = None          # JSON libre, ex: {"mission_id": 42}


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