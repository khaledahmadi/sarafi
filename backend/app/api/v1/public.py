from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.models.user import User
from app.schemas.article import ArticleDetailOut, ArticleListOut
from app.schemas.branch import BranchPublicOut
from app.schemas.comment import CommentCreate, CommentPublicOut
from app.schemas.contact import ContactValidateRequest
from app.schemas.faq import FaqPublicOut
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.schemas.currency import CurrencyPublicOut
from app.schemas.service import ServicePublicOut
from app.schemas.settings import SiteSettingOut
from app.services import articles as articles_service
from app.services import branches as branches_service
from app.services import comments as comments_service
from app.services import contact as contact_service
from app.services import faqs as faqs_service
from app.services import feedback as feedback_service
from app.services import currencies as currencies_service
from app.services import services_catalog as services_service
from app.services import settings as settings_service

router = APIRouter(tags=["public"])


@router.get("/rates", response_model=list[CurrencyPublicOut])
def list_rates(db: Session = Depends(get_db)) -> list[CurrencyPublicOut]:
    rows = currencies_service.list_active_currencies(db)
    return [CurrencyPublicOut.model_validate(r) for r in rows]


@router.get("/services", response_model=list[ServicePublicOut])
def list_services(db: Session = Depends(get_db)) -> list[ServicePublicOut]:
    rows = services_service.list_active_services(db)
    return [ServicePublicOut.model_validate(r) for r in rows]


@router.get("/branches", response_model=list[BranchPublicOut])
def list_branches(db: Session = Depends(get_db)) -> list[BranchPublicOut]:
    rows = branches_service.list_branches(db)
    return [BranchPublicOut.model_validate(r) for r in rows]


@router.get("/articles", response_model=list[ArticleListOut])
def list_articles(db: Session = Depends(get_db)) -> list[ArticleListOut]:
    rows = articles_service.list_published_articles(db)
    return [ArticleListOut.model_validate(r) for r in rows]


@router.get("/articles/{slug}", response_model=ArticleDetailOut)
def get_article(slug: str, db: Session = Depends(get_db)) -> ArticleDetailOut:
    row = articles_service.get_published_article(db, slug)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return ArticleDetailOut.model_validate(row)


@router.get("/articles/{slug}/comments", response_model=list[CommentPublicOut])
def list_article_comments(slug: str, db: Session = Depends(get_db)) -> list[CommentPublicOut]:
    rows = comments_service.list_approved_comments(db, slug)
    if rows is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return rows


@router.post("/articles/{slug}/comments")
def create_article_comment(
    slug: str,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user: Annotated[User | None, Depends(get_current_user_optional)] = None,
) -> dict:
    return comments_service.create_comment(db, slug, payload, user)


@router.get("/settings", response_model=list[SiteSettingOut])
def list_settings(db: Session = Depends(get_db)) -> list[SiteSettingOut]:
    rows = settings_service.list_settings(db)
    return [SiteSettingOut.model_validate(r) for r in rows]


@router.post("/contact/validate")
def validate_contact(payload: ContactValidateRequest) -> dict:
    return contact_service.validate_contact(payload)


@router.get("/faqs", response_model=list[FaqPublicOut])
def list_faqs(db: Session = Depends(get_db)) -> list[FaqPublicOut]:
    rows = faqs_service.list_active_faqs(db)
    return [FaqPublicOut.model_validate(r) for r in rows]


@router.get("/feedback", response_model=list[FeedbackOut])
def list_feedback(db: Session = Depends(get_db)) -> list[FeedbackOut]:
    return feedback_service.list_public_feedback(db)


@router.post("/feedback")
def create_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    user: Annotated[User | None, Depends(get_current_user_optional)] = None,
) -> dict:
    return feedback_service.create_feedback(db, payload, user)
