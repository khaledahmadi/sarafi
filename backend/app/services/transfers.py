import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.transfer import TransferRequest, TransferStatus
from app.models.user import User
from app.schemas.transfer import TransferCreate, TransferUpdate


def list_my_transfers(db: Session, user: User) -> list[TransferRequest]:
    return list(
        db.scalars(
            select(TransferRequest)
            .where(TransferRequest.user_id == user.id)
            .order_by(TransferRequest.created_at.desc())
        ).all()
    )


def list_transfers(db: Session, *, limit: int = 200) -> list[TransferRequest]:
    limit = max(1, min(limit, 500))
    return list(
        db.scalars(
            select(TransferRequest).order_by(TransferRequest.created_at.desc()).limit(limit)
        ).all()
    )


def list_recent_transfers(db: Session, *, limit: int = 5) -> list[TransferRequest]:
    limit = max(1, min(limit, 50))
    return list(
        db.scalars(
            select(TransferRequest).order_by(TransferRequest.created_at.desc()).limit(limit)
        ).all()
    )


def create_transfer(db: Session, user: User, payload: TransferCreate) -> dict:
    row = TransferRequest(
        user_id=user.id,
        status=TransferStatus.PENDING,
    )
    error = _apply_transfer_fields(row, payload)
    if error:
        return error
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"ok": True, "data": {"reference": row.reference}}


def cancel_transfer(db: Session, user: User, transfer_id: uuid.UUID) -> dict:
    row = db.get(TransferRequest, transfer_id)
    if not row or row.user_id != user.id:
        return {"ok": False, "message": "حواله یافت نشد"}
    if row.status != TransferStatus.PENDING:
        return {"ok": False, "message": "فقط حواله‌های در انتظار قابل لغو هستند"}
    row.status = TransferStatus.CANCELLED
    db.commit()
    return {"ok": True}


def update_transfer_status(db: Session, transfer_id: uuid.UUID, status: TransferStatus) -> dict:
    row = db.get(TransferRequest, transfer_id)
    if not row:
        return {"ok": False, "message": "حواله یافت نشد"}
    row.status = status
    db.commit()
    return {"ok": True}


def update_transfer_note(db: Session, transfer_id: uuid.UUID, staff_note: str) -> dict:
    row = db.get(TransferRequest, transfer_id)
    if not row:
        return {"ok": False, "message": "حواله یافت نشد"}
    row.staff_note = staff_note.strip() or None
    db.commit()
    return {"ok": True}


def _apply_transfer_fields(row: TransferRequest, payload: TransferCreate) -> dict | None:
    if payload.from_currency == payload.to_currency:
        return {
            "ok": False,
            "message": "ارز مبدا و مقصد نمی‌تواند یکسان باشد",
            "fieldErrors": {"to_currency": "validation.toCurrencyDifferent"},
        }
    row.from_currency = payload.from_currency
    row.to_currency = payload.to_currency
    row.amount = payload.amount
    row.destination_fa = payload.destination_fa.strip()
    row.recipient_name = payload.recipient_name.strip()
    row.recipient_detail = payload.recipient_detail.strip()
    row.note = (payload.note or "").strip() or None
    return None


def update_transfer(db: Session, transfer_id: uuid.UUID, payload: TransferUpdate) -> dict:
    row = db.get(TransferRequest, transfer_id)
    if not row:
        return {"ok": False, "message": "حواله یافت نشد"}
    error = _apply_transfer_fields(row, payload)
    if error:
        return error
    db.commit()
    return {"ok": True}


def delete_transfer(db: Session, transfer_id: uuid.UUID) -> dict:
    row = db.get(TransferRequest, transfer_id)
    if not row:
        return {"ok": False, "message": "حواله یافت نشد"}
    db.delete(row)
    db.commit()
    return {"ok": True}
