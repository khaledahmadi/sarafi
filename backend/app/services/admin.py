import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.article import Article
from app.models.branch import Branch
from app.models.comment import Comment
from app.models.currency import Currency
from app.models.feedback import Feedback, FeedbackStatus
from app.models.service import Service
from app.models.transfer import TransferRequest, TransferStatus
from app.models.user import AppRole, User, UserRole
from app.schemas.admin import AdminStatsOut
from app.schemas.auth import AdminCreateUserRequest
from app.schemas.common import fail_result, ok_result
from app.services.auth import get_user_by_email


def get_stats(db: Session) -> AdminStatsOut:
    transfers = db.scalar(select(func.count()).select_from(TransferRequest)) or 0
    pending = (
        db.scalar(
            select(func.count())
            .select_from(TransferRequest)
            .where(TransferRequest.status == TransferStatus.PENDING)
        )
        or 0
    )
    currencies = db.scalar(select(func.count()).select_from(Currency)) or 0
    services = db.scalar(select(func.count()).select_from(Service)) or 0
    branches = db.scalar(select(func.count()).select_from(Branch)) or 0
    articles = db.scalar(select(func.count()).select_from(Article)) or 0
    pending_comments = (
        db.scalar(
            select(func.count()).select_from(Comment).where(Comment.is_approved.is_(False))
        )
        or 0
    )
    pending_feedbacks = (
        db.scalar(
            select(func.count()).select_from(Feedback).where(Feedback.status == FeedbackStatus.PENDING)
        )
        or 0
    )
    return AdminStatsOut(
        transfers=transfers,
        pending=pending,
        currencies=currencies,
        services=services,
        branches=branches,
        articles=articles,
        pending_comments=pending_comments,
        pending_feedbacks=pending_feedbacks,
    )


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.asc())).all())


def create_user(db: Session, payload: AdminCreateUserRequest) -> dict:
    if payload.role == AppRole.ADMIN:
        return fail_result(
            "ایجاد مدیر جدید مجاز نیست. تنها یک مدیر کافی است.",
            {"role": "نقش مدیر قابل انتخاب نیست"},
        )
    if get_user_by_email(db, payload.email):
        return fail_result(
            "این ایمیل قبلاً ثبت شده است",
            {"email": "این ایمیل قبلاً ثبت شده است"},
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        phone=(payload.phone or "").strip() or None,
        is_active=True,
    )
    db.add(user)
    try:
        db.flush()
        db.add(UserRole(user_id=user.id, role=payload.role))
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        return fail_result(
            "این ایمیل قبلاً ثبت شده است",
            {"email": "این ایمیل قبلاً ثبت شده است"},
        )
    return ok_result({"id": str(user.id)})


def set_user_role(db: Session, *, actor: User, user_id: uuid.UUID, role: AppRole) -> dict:
    if user_id == actor.id:
        return {"ok": False, "message": "تغییر نقش حساب خودتان امکان‌پذیر نیست."}

    target = db.get(User, user_id)
    if not target:
        return {"ok": False, "message": "کاربر یافت نشد"}
    if role == AppRole.ADMIN:
        return {"ok": False, "message": "ایجاد مدیر جدید مجاز نیست. تنها یک مدیر کافی است."}
    if target.has_role(AppRole.ADMIN):
        return {"ok": False, "message": "نقش مدیر قابل تغییر نیست."}

    existing = list(db.scalars(select(UserRole).where(UserRole.user_id == user_id)).all())
    for row in existing:
        db.delete(row)
    db.flush()
    db.add(UserRole(user_id=user_id, role=role))
    db.commit()
    return {"ok": True}
