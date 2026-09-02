import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class CurrencyPublicOut(ORMModel):
    rate_source: str
    code: str
    name_fa: str
    name_en: str | None = None
    name_ps: str | None = None
    flag: str | None = None
    buy_rate: Decimal
    sell_rate: Decimal
    updated_at: datetime


class CurrencyOut(ORMModel):
    id: uuid.UUID
    rate_source: str
    code: str
    name_fa: str
    name_en: str | None = None
    name_ps: str | None = None
    flag: str | None = None
    buy_rate: Decimal
    sell_rate: Decimal
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CurrencyCreate(BaseModel):
    rate_source: str = Field(default="sarai_shahzada", min_length=2, max_length=32)
    code: str = Field(min_length=3, max_length=8, pattern=r"^[A-Z]{3,8}$")
    name_fa: str = Field(min_length=2, max_length=80)
    name_en: str | None = Field(default=None, max_length=80)
    name_ps: str | None = Field(default=None, max_length=80)
    flag: str | None = Field(default=None, max_length=16)
    buy_rate: Decimal = Field(gt=0, max_digits=18, decimal_places=4)
    sell_rate: Decimal = Field(gt=0, max_digits=18, decimal_places=4)
    sort_order: int = Field(default=0, ge=0, le=999)
    is_active: bool = True


class CurrencyUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=3, max_length=8, pattern=r"^[A-Z]{3,8}$")
    name_fa: str | None = Field(default=None, min_length=2, max_length=80)
    name_en: str | None = Field(default=None, max_length=80)
    name_ps: str | None = Field(default=None, max_length=80)
    flag: str | None = Field(default=None, max_length=16)
    buy_rate: Decimal | None = Field(default=None, gt=0, max_digits=18, decimal_places=4)
    sell_rate: Decimal | None = Field(default=None, gt=0, max_digits=18, decimal_places=4)
    sort_order: int | None = Field(default=None, ge=0, le=999)
    is_active: bool | None = None
