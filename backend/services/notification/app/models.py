from datetime import datetime
from sqlalchemy import DateTime, String, Boolean, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Ciblage — l'un ou l'autre est renseigné, pas les deux obligatoirement
    target_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    target_role: Mapped[str | None] = mapped_column(String, nullable=True, index=True)

    # Contenu
    type: Mapped[str] = mapped_column(String, nullable=False)   # ex: "nouvelle_mission"
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON libre

    # État
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    # Expéditeur (optionnel, pour audit)
    sender_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )