import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ServicePublicOut(ORMModel):
    slug: str
    title_fa: str
    title_en: str | None = None
    title_ps: str | None = None
    summary_fa: str
    summary_en: str | None = None
    summary_ps: str | None = None
    icon: str


class ServiceOut(ORMModel):
    id: uuid.UUID
    slug: str
    title_fa: str
    title_en: str | None = None
    title_ps: str | None = None
    summary_fa: str
    summary_en: str | None = None
    summary_ps: str | None = None
    icon: str
    sort_order: int
    is_active: bool
    created_at: datetime


class ServiceCreate(BaseModel):
    slug: str = Field(min_length=3, max_length=90, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title_fa: str = Field(min_length=3, max_length=120)
    title_en: str | None = Field(default=None, max_length=120)
    title_ps: str | None = Field(default=None, max_length=120)
    summary_fa: str = Field(min_length=10, max_length=400)
    summary_en: str | None = Field(default=None, max_length=400)
    summary_ps: str | None = Field(default=None, max_length=400)
    icon: str = Field(min_length=2, max_length=40)
    sort_order: int = Field(default=0, ge=0, le=999)
    is_active: bool = True


class ServiceUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=3, max_length=90, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title_fa: str | None = Field(default=None, min_length=3, max_length=120)
    title_en: str | None = Field(default=None, max_length=120)
    title_ps: str | None = Field(default=None, max_length=120)
    summary_fa: str | None = Field(default=None, min_length=10, max_length=400)
    summary_en: str | None = Field(default=None, max_length=400)
    summary_ps: str | None = Field(default=None, max_length=400)
    icon: str | None = Field(default=None, min_length=2, max_length=40)
    sort_order: int | None = Field(default=None, ge=0, le=999)
    is_active: bool | None = None
