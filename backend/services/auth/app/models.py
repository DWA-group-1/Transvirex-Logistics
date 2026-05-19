from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Role(str, Enum):
    DRIVER = "driver"
    DISPATCHER = "dispatcher"
    BILLING = "billing"
    MANAGER = "manager"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True)
    hashed_password: Mapped[str]
    role: Mapped[str]
    is_admin: Mapped[bool] = mapped_column(
        default=False, nullable=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
