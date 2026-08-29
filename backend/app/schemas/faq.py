import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class FaqPublicOut(ORMModel):
    id: uuid.UUID
    question: str
    answer: str
    keywords: str | None = None


class FaqOut(ORMModel):
    id: uuid.UUID
    question: str
    answer: str
    keywords: str | None = None
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class FaqCreate(BaseModel):
    question: str = Field(min_length=3, max_length=200)
    answer: str = Field(min_length=3, max_length=2000)
    keywords: str | None = Field(default=None, max_length=300)
    sort_order: int = Field(default=0, ge=0, le=999)
    is_active: bool = True


class FaqUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=3, max_length=200)
    answer: str | None = Field(default=None, min_length=3, max_length=2000)
    keywords: str | None = Field(default=None, max_length=300)
    sort_order: int | None = Field(default=None, ge=0, le=999)
    is_active: bool | None = None
