import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.transfer import TransferStatus
from app.schemas.common import ORMModel


class TransferCreate(BaseModel):
    from_currency: str = Field(min_length=3, max_length=8, pattern=r"^[A-Z]{3,8}$")
    to_currency: str = Field(min_length=3, max_length=8, pattern=r"^[A-Z]{3,8}$")
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    destination_fa: str = Field(min_length=2, max_length=80)
    recipient_name: str = Field(min_length=3, max_length=120)
    recipient_detail: str = Field(min_length=3, max_length=300)
    note: str | None = Field(default=None, max_length=500)


class TransferUpdate(TransferCreate):
    pass


class TransferOut(ORMModel):
    id: uuid.UUID
    reference: str
    user_id: uuid.UUID
    from_currency: str
    to_currency: str
    amount: Decimal
    destination_fa: str
    recipient_name: str
    recipient_detail: str
    note: str | None = None
    status: TransferStatus
    staff_note: str | None = None
    created_at: datetime
    updated_at: datetime


class TransferStatusUpdate(BaseModel):
    status: TransferStatus


class TransferNoteUpdate(BaseModel):
    staff_note: str = Field(max_length=500)
