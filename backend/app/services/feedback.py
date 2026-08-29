import re
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.feedback import Feedback, FeedbackStatus
from app.models.user import User
from app.schemas.common import fail_result, ok_result
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.services.sanitize import html_to_text

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _author_name(row: Feedback) -> str:
    if row.user and (row.user.full_name or "").strip():
        return row.user.full_name.strip()
    if row.user and row.user.email:
        return row.user.email
    return (row.guest_name or "").strip() or "مهمان"


def _to_out(row: Feedback) -> FeedbackOut:
    return FeedbackOut(
        id=row.id,
        author=_author_name(row),
        body=row.body,
        rating=row.rating,
        status=row.status,
        created_at=row.created_at,
    )


def create_feedback(db: Session, payload: FeedbackCreate, user: User | None) -> dict:
    body = html_to_text(payload.body)
    errors: dict[str, str] = {}
    if not body:
        errors["body"] = "متن بازخورد را بنویسید"
    if payload.rating < 1 or payload.rating > 5:
        errors["rating"] = "امتیاز باید بین ۱ تا ۵ باشد"

    guest_name = (payload.guest_name or "").strip() or None
    guest_email = (payload.guest_email or "").strip().lower() or None
    if user is None:
        if not guest_name or len(guest_name) < 2:
            errors["guest_name"] = "نام را وارد کنید"
        if not guest_email or not _EMAIL.match(guest_email):
            errors["guest_email"] = "ایمیل معتبر وارد کنید"
    if errors:
        return fail_result("اطلاعات فرم را بررسی کنید", errors)

    row = Feedback(
        user_id=user.id if user else None,
        guest_name=None if user else guest_name,
        guest_email=None if user else guest_email,
        body=body[:2000],
        rating=payload.rating,
        status=FeedbackStatus.PENDING,
    )
    db.add(row)
    db.commit()
    return ok_result()


def list_public_feedback(db: Session) -> list[FeedbackOut]:
    rows = list(
        db.scalars(
            select(Feedback).options(joinedload(Feedback.user)).order_by(Feedback.created_at.desc())
        )
        .unique()
        .all()
    )
    return [_to_out(row) for row in rows]


def list_admin_feedback(db: Session) -> list[FeedbackOut]:
    return list_public_feedback(db)


def review_feedback(db: Session, feedback_id: uuid.UUID) -> dict:
    row = db.get(Feedback, feedback_id)
    if not row:
        return fail_result("بازخورد یافت نشد")
    row.status = FeedbackStatus.REVIEWED
    db.commit()
    return ok_result()


def delete_feedback(db: Session, feedback_id: uuid.UUID) -> dict:
    row = db.get(Feedback, feedback_id)
    if not row:
        return fail_result("بازخورد یافت نشد")
    db.delete(row)
    db.commit()
    return ok_result()
