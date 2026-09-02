import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    title_fa: Mapped[str] = mapped_column(String(160), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(160), nullable=True)
    title_ps: Mapped[str | None] = mapped_column(String(160), nullable=True)
    excerpt_fa: Mapped[str] = mapped_column(String(300), nullable=False)
    excerpt_en: Mapped[str | None] = mapped_column(String(300), nullable=True)
    excerpt_ps: Mapped[str | None] = mapped_column(String(300), nullable=True)
    body_fa: Mapped[str] = mapped_column(Text, nullable=False)
    body_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_ps: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
