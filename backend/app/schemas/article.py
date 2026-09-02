import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ArticleListOut(ORMModel):
    slug: str
    title_fa: str
    title_en: str | None = None
    title_ps: str | None = None
    excerpt_fa: str
    excerpt_en: str | None = None
    excerpt_ps: str | None = None
    cover_url: str | None = None
    published_at: datetime


class ArticleDetailOut(ORMModel):
    slug: str
    title_fa: str
    title_en: str | None = None
    title_ps: str | None = None
    excerpt_fa: str
    excerpt_en: str | None = None
    excerpt_ps: str | None = None
    body_fa: str
    body_en: str | None = None
    body_ps: str | None = None
    cover_url: str | None = None
    published_at: datetime


class ArticleOut(ORMModel):
    id: uuid.UUID
    slug: str
    title_fa: str
    title_en: str | None = None
    title_ps: str | None = None
    excerpt_fa: str
    excerpt_en: str | None = None
    excerpt_ps: str | None = None
    body_fa: str
    body_en: str | None = None
    body_ps: str | None = None
    cover_url: str | None = None
    is_published: bool
    published_at: datetime
    created_at: datetime
    updated_at: datetime


class ArticleCreate(BaseModel):
    slug: str = Field(min_length=3, max_length=90, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title_fa: str = Field(min_length=5, max_length=160)
    title_en: str | None = Field(default=None, max_length=160)
    title_ps: str | None = Field(default=None, max_length=160)
    excerpt_fa: str = Field(min_length=20, max_length=300)
    excerpt_en: str | None = Field(default=None, max_length=300)
    excerpt_ps: str | None = Field(default=None, max_length=300)
    body_fa: str = Field(min_length=1, max_length=60000)
    body_en: str | None = Field(default=None, max_length=60000)
    body_ps: str | None = Field(default=None, max_length=60000)
    cover_url: str | None = Field(default=None, max_length=500)
    is_published: bool = True


class ArticleUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=3, max_length=90, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title_fa: str | None = Field(default=None, min_length=5, max_length=160)
    title_en: str | None = Field(default=None, max_length=160)
    title_ps: str | None = Field(default=None, max_length=160)
    excerpt_fa: str | None = Field(default=None, min_length=20, max_length=300)
    excerpt_en: str | None = Field(default=None, max_length=300)
    excerpt_ps: str | None = Field(default=None, max_length=300)
    body_fa: str | None = Field(default=None, min_length=1, max_length=60000)
    body_en: str | None = Field(default=None, max_length=60000)
    body_ps: str | None = Field(default=None, max_length=60000)
    cover_url: str | None = Field(default=None, max_length=500)
    is_published: bool | None = None
