import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class CommentPublicOut(BaseModel):
    id: uuid.UUID
    author: str
    body: str
    created_at: datetime
    replies: list["CommentPublicOut"] = Field(default_factory=list)


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)
    parent_id: uuid.UUID | None = None
    guest_name: str | None = Field(default=None, max_length=120)
    guest_email: str | None = Field(default=None, max_length=255)


class CommentAdminOut(ORMModel):
    id: uuid.UUID
    article_title: str
    author: str
    body: str
    is_approved: bool
    is_reply: bool
    created_at: datetime
