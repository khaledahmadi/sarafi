import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class BranchPublicOut(ORMModel):
    id: uuid.UUID
    name_fa: str
    name_en: str | None = None
    name_ps: str | None = None
    city_fa: str
    city_en: str | None = None
    city_ps: str | None = None
    country_fa: str
    country_en: str | None = None
    country_ps: str | None = None
    address_fa: str | None = None
    address_en: str | None = None
    address_ps: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    map_url: str | None = None


class BranchOut(ORMModel):
    id: uuid.UUID
    name_fa: str
    name_en: str | None = None
    name_ps: str | None = None
    city_fa: str
    city_en: str | None = None
    city_ps: str | None = None
    country_fa: str
    country_en: str | None = None
    country_ps: str | None = None
    address_fa: str | None = None
    address_en: str | None = None
    address_ps: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    map_url: str | None = None
    sort_order: int
    created_at: datetime


class BranchCreate(BaseModel):
    name_fa: str = Field(min_length=3, max_length=120)
    name_en: str | None = Field(default=None, max_length=120)
    name_ps: str | None = Field(default=None, max_length=120)
    city_fa: str = Field(min_length=2, max_length=80)
    city_en: str | None = Field(default=None, max_length=80)
    city_ps: str | None = Field(default=None, max_length=80)
    country_fa: str = Field(min_length=2, max_length=80)
    country_en: str | None = Field(default=None, max_length=80)
    country_ps: str | None = Field(default=None, max_length=80)
    address_fa: str | None = Field(default=None, max_length=300)
    address_en: str | None = Field(default=None, max_length=300)
    address_ps: str | None = Field(default=None, max_length=300)
    phone: str | None = Field(default=None, max_length=30)
    whatsapp: str | None = Field(default=None, max_length=30)
    map_url: str | None = Field(default=None, max_length=500)
    sort_order: int = Field(default=0, ge=0, le=999)


class BranchUpdate(BaseModel):
    name_fa: str | None = Field(default=None, min_length=3, max_length=120)
    name_en: str | None = Field(default=None, max_length=120)
    name_ps: str | None = Field(default=None, max_length=120)
    city_fa: str | None = Field(default=None, min_length=2, max_length=80)
    city_en: str | None = Field(default=None, max_length=80)
    city_ps: str | None = Field(default=None, max_length=80)
    country_fa: str | None = Field(default=None, min_length=2, max_length=80)
    country_en: str | None = Field(default=None, max_length=80)
    country_ps: str | None = Field(default=None, max_length=80)
    address_fa: str | None = Field(default=None, max_length=300)
    address_en: str | None = Field(default=None, max_length=300)
    address_ps: str | None = Field(default=None, max_length=300)
    phone: str | None = Field(default=None, max_length=30)
    whatsapp: str | None = Field(default=None, max_length=30)
    map_url: str | None = Field(default=None, max_length=500)
    sort_order: int | None = Field(default=None, ge=0, le=999)
