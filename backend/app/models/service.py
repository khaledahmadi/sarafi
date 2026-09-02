import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    title_fa: Mapped[str] = mapped_column(String(120), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(120), nullable=True)
    title_ps: Mapped[str | None] = mapped_column(String(120), nullable=True)
    summary_fa: Mapped[str] = mapped_column(Text, nullable=False)
    summary_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_ps: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(40), nullable=False, default="send")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
