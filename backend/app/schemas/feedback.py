import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.feedback import FeedbackStatus
from app.schemas.common import ORMModel


class FeedbackCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)
    rating: int = Field(ge=1, le=5)
    guest_name: str | None = Field(default=None, max_length=120)
    guest_email: str | None = Field(default=None, max_length=255)


class FeedbackOut(ORMModel):
    id: uuid.UUID
    author: str
    body: str
    rating: int
    status: FeedbackStatus
    created_at: datetime
