import re
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.article import Article
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentAdminOut, CommentCreate, CommentPublicOut
from app.schemas.common import fail_result, ok_result
from app.services.sanitize import html_to_text

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _author_name(row: Comment) -> str:
    if row.user and (row.user.full_name or "").strip():
        return row.user.full_name.strip()
    if row.user and row.user.email:
        return row.user.email
    return (row.guest_name or "").strip() or "مهمان"


def _public_item(row: Comment, replies: list[CommentPublicOut] | None = None) -> CommentPublicOut:
    return CommentPublicOut(
        id=row.id,
        author=_author_name(row),
        body=row.body,
        created_at=row.created_at,
        replies=replies or [],
    )


def list_approved_comments(db: Session, slug: str) -> list[CommentPublicOut] | None:
    article = db.scalar(select(Article).where(Article.slug == slug, Article.is_published.is_(True)))
    if not article:
        return None
    rows = list(
        db.scalars(
            select(Comment)
            .options(joinedload(Comment.user))
            .where(Comment.article_id == article.id, Comment.is_approved.is_(True))
            .order_by(Comment.created_at.asc())
        )
        .unique()
        .all()
    )
    replies_by_parent: dict[uuid.UUID, list[CommentPublicOut]] = {}
    tops: list[Comment] = []
    for row in rows:
        if row.parent_id:
            replies_by_parent.setdefault(row.parent_id, []).append(_public_item(row))
        else:
            tops.append(row)
    return [_public_item(row, replies_by_parent.get(row.id, [])) for row in tops]


def create_comment(db: Session, slug: str, payload: CommentCreate, user: User | None) -> dict:
    article = db.scalar(select(Article).where(Article.slug == slug, Article.is_published.is_(True)))
    if not article:
        return fail_result("مقاله یافت نشد")

    body = html_to_text(payload.body)
    if not body:
        return fail_result("validation.commentBodyRequired", {"body": "validation.commentBodyRequired"})
    if len(body) > 5000:
        return fail_result("validation.commentBodyMax", {"body": "validation.commentBodyMax"})

    parent_id = None
    if payload.parent_id:
        parent = db.get(Comment, payload.parent_id)
        if not parent or parent.article_id != article.id:
            return fail_result("نظر مورد نظر یافت نشد", {"parent_id": "نظر مورد نظر یافت نشد"})
        parent_id = parent.parent_id or parent.id

    guest_name = (payload.guest_name or "").strip() or None
    guest_email = (payload.guest_email or "").strip().lower() or None

    if user is None:
        errors: dict[str, str] = {}
        if not guest_name or len(guest_name) < 2:
            errors["guest_name"] = "validation.guestNameMin"
        if not guest_email or not _EMAIL.match(guest_email):
            errors["guest_email"] = "validation.invalidEmail"
        if errors:
            return fail_result("validation.formInvalid", errors)

    row = Comment(
        article_id=article.id,
        parent_id=parent_id,
        user_id=user.id if user else None,
        guest_name=None if user else guest_name,
        guest_email=None if user else guest_email,
        body=body,
        is_approved=True,
    )
    db.add(row)
    db.commit()
    return ok_result()


def list_admin_comments(db: Session) -> list[CommentAdminOut]:
    rows = list(
        db.scalars(
            select(Comment)
            .options(joinedload(Comment.user), joinedload(Comment.article))
            .order_by(Comment.created_at.desc())
        )
        .unique()
        .all()
    )
    return [
        CommentAdminOut(
            id=row.id,
            article_title=row.article.title_fa if row.article else "—",
            author=_author_name(row),
            body=row.body,
            is_approved=row.is_approved,
            is_reply=row.parent_id is not None,
            created_at=row.created_at,
        )
        for row in rows
    ]


def approve_comment(db: Session, comment_id: uuid.UUID) -> dict:
    row = db.get(Comment, comment_id)
    if not row:
        return fail_result("نظر یافت نشد")
    row.is_approved = True
    db.commit()
    return ok_result()


def delete_comment(db: Session, comment_id: uuid.UUID) -> dict:
    row = db.get(Comment, comment_id)
    if not row:
        return fail_result("نظر یافت نشد")
    db.delete(row)
    db.commit()
    return ok_result()
