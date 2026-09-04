import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.article import Article
from app.schemas.article import ArticleCreate, ArticleUpdate
from app.services.sanitize import html_to_text, sanitize_article_html


def list_published_articles(db: Session) -> list[Article]:
    return list(
        db.scalars(
            select(Article)
            .where(Article.is_published.is_(True))
            .order_by(Article.published_at.desc())
        ).all()
    )


def get_published_article(db: Session, slug: str) -> Article | None:
    return db.scalar(
        select(Article).where(Article.slug == slug, Article.is_published.is_(True))
    )


def list_all_articles(db: Session) -> list[Article]:
    return list(db.scalars(select(Article).order_by(Article.published_at.desc())).all())


def _prepare_body(body_fa: str) -> tuple[str | None, dict | None]:
    body = sanitize_article_html(body_fa)
    if len(html_to_text(body)) < 30:
        return None, {
            "ok": False,
            "message": "متن مقاله حداقل ۳۰ حرف باشد",
            "fieldErrors": {"body_fa": "validation.articleBodyMin"},
        }
    return body, None


def create_article(db: Session, payload: ArticleCreate) -> dict:
    body, err = _prepare_body(payload.body_fa)
    if err:
        return err

    cover = (payload.cover_url or "").strip() or None
    row = Article(
        slug=payload.slug.strip(),
        title_fa=payload.title_fa.strip(),
        excerpt_fa=payload.excerpt_fa.strip(),
        body_fa=body or "",
        cover_url=cover,
        is_published=payload.is_published,
        published_at=datetime.now(timezone.utc),
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {
            "ok": False,
            "message": "این نشانی مقاله قبلاً ثبت شده است",
            "fieldErrors": {"slug": "validation.slugTaken"},
        }
    return {"ok": True, "data": {"slug": row.slug}}


def update_article(db: Session, article_id: uuid.UUID, payload: ArticleUpdate) -> dict:
    row = db.get(Article, article_id)
    if not row:
        return {"ok": False, "message": "مقاله یافت نشد"}

    data = payload.model_dump(exclude_unset=True)
    if "body_fa" in data and data["body_fa"] is not None:
        body, err = _prepare_body(data["body_fa"])
        if err:
            return err
        data["body_fa"] = body
    if "cover_url" in data:
        data["cover_url"] = (data["cover_url"] or "").strip() or None
    for key in ("slug", "title_fa", "excerpt_fa"):
        if key in data and data[key] is not None:
            data[key] = data[key].strip()

    was_unpublished = not row.is_published
    for key, value in data.items():
        setattr(row, key, value)

    if was_unpublished and row.is_published:
        row.published_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {
            "ok": False,
            "message": "این نشانی مقاله قبلاً ثبت شده است",
            "fieldErrors": {"slug": "validation.slugTaken"},
        }
    return {"ok": True, "data": {"slug": row.slug}}


def delete_article(db: Session, article_id: uuid.UUID) -> dict:
    row = db.get(Article, article_id)
    if not row:
        return {"ok": False, "message": "مقاله یافت نشد"}
    db.delete(row)
    db.commit()
    return {"ok": True}
