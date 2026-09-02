import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_sources import normalize_rate_source
from app.core.database import get_db
from app.core.dependencies import require_admin, require_staff
from app.models.user import User
from app.schemas.admin import AdminStatsOut
from app.schemas.article import ArticleCreate, ArticleOut, ArticleUpdate
from app.schemas.auth import AdminCreateUserRequest, AdminUserOut, SetUserRoleRequest
from app.schemas.branch import BranchCreate, BranchOut, BranchUpdate
from app.schemas.comment import CommentAdminOut
from app.schemas.faq import FaqCreate, FaqOut, FaqUpdate
from app.schemas.feedback import FeedbackOut
from app.schemas.currency import CurrencyCreate, CurrencyOut, CurrencyUpdate
from app.schemas.service import ServiceCreate, ServiceOut, ServiceUpdate
from app.schemas.settings import SettingsBulkUpdate, SiteSettingOut
from app.schemas.transfer import (
    TransferNoteUpdate,
    TransferOut,
    TransferStatusUpdate,
    TransferUpdate,
)
from app.services import admin as admin_service
from app.services import articles as articles_service
from app.services import branches as branches_service
from app.services import comments as comments_service
from app.services import faqs as faqs_service
from app.services import feedback as feedback_service
from app.services import currencies as currencies_service
from app.services import services_catalog as services_service
from app.services import settings as settings_service
from app.services import transfers as transfers_service
from app.services import uploads as uploads_service
from app.services.seed import run_seed

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsOut)
def stats(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> AdminStatsOut:
    return admin_service.get_stats(db)


@router.get("/transfers", response_model=list[TransferOut])
def admin_transfers(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
    limit: int = Query(default=200, ge=1, le=500),
) -> list[TransferOut]:
    rows = transfers_service.list_transfers(db, limit=limit)
    return [TransferOut.model_validate(r) for r in rows]


@router.get("/transfers/recent", response_model=list[TransferOut])
def admin_recent_transfers(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
    limit: int = Query(default=5, ge=1, le=50),
) -> list[TransferOut]:
    rows = transfers_service.list_recent_transfers(db, limit=limit)
    return [TransferOut.model_validate(r) for r in rows]


@router.patch("/transfers/{transfer_id}/status")
def patch_transfer_status(
    transfer_id: uuid.UUID,
    payload: TransferStatusUpdate,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return transfers_service.update_transfer_status(db, transfer_id, payload.status)


@router.patch("/transfers/{transfer_id}/note")
def patch_transfer_note(
    transfer_id: uuid.UUID,
    payload: TransferNoteUpdate,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return transfers_service.update_transfer_note(db, transfer_id, payload.staff_note)


@router.put("/transfers/{transfer_id}")
def put_transfer(
    transfer_id: uuid.UUID,
    payload: TransferUpdate,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return transfers_service.update_transfer(db, transfer_id, payload)


@router.delete("/transfers/{transfer_id}")
def delete_transfer(
    transfer_id: uuid.UUID,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return transfers_service.delete_transfer(db, transfer_id)


@router.get("/currencies", response_model=list[CurrencyOut])
def admin_currencies(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
    source: str = Query(default="sarai_shahzada"),
) -> list[CurrencyOut]:
    rows = currencies_service.list_all_currencies(db, rate_source=normalize_rate_source(source))
    return [CurrencyOut.model_validate(r) for r in rows]


@router.post("/currencies")
def create_currency(
    payload: CurrencyCreate,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return currencies_service.create_currency(db, payload)


@router.put("/currencies/{currency_id}")
def update_currency(
    currency_id: uuid.UUID,
    payload: CurrencyUpdate,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return currencies_service.update_currency(db, currency_id, payload)


@router.delete("/currencies/{currency_id}")
def delete_currency(
    currency_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return currencies_service.delete_currency(db, currency_id)


@router.get("/services", response_model=list[ServiceOut])
def admin_services(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> list[ServiceOut]:
    rows = services_service.list_all_services(db)
    return [ServiceOut.model_validate(r) for r in rows]


@router.post("/services")
def create_service(
    payload: ServiceCreate,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return services_service.create_service(db, payload)


@router.put("/services/{service_id}")
def update_service(
    service_id: uuid.UUID,
    payload: ServiceUpdate,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return services_service.update_service(db, service_id, payload)


@router.delete("/services/{service_id}")
def delete_service(
    service_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return services_service.delete_service(db, service_id)


@router.get("/branches", response_model=list[BranchOut])
def admin_branches(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> list[BranchOut]:
    rows = branches_service.list_branches(db)
    return [BranchOut.model_validate(r) for r in rows]


@router.post("/branches")
def create_branch(
    payload: BranchCreate,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return branches_service.create_branch(db, payload)


@router.put("/branches/{branch_id}")
def update_branch(
    branch_id: uuid.UUID,
    payload: BranchUpdate,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return branches_service.update_branch(db, branch_id, payload)


@router.delete("/branches/{branch_id}")
def delete_branch(
    branch_id: uuid.UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return branches_service.delete_branch(db, branch_id)


@router.get("/articles", response_model=list[ArticleOut])
def admin_articles(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> list[ArticleOut]:
    rows = articles_service.list_all_articles(db)
    return [ArticleOut.model_validate(r) for r in rows]


@router.post("/articles")
def create_article(
    payload: ArticleCreate,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return articles_service.create_article(db, payload)


@router.put("/articles/{article_id}")
def update_article(
    article_id: uuid.UUID,
    payload: ArticleUpdate,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return articles_service.update_article(db, article_id, payload)


@router.post("/uploads")
def upload_image(
    _: Annotated[User, Depends(require_staff)],
    image: UploadFile = File(...),
) -> dict:
    result = uploads_service.save_image(image)
    if not result.get("ok"):
        return result
    data = result.get("data") if isinstance(result.get("data"), dict) else {}
    return {"url": data.get("url", "")}


@router.get("/comments", response_model=list[CommentAdminOut])
def admin_comments(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> list[CommentAdminOut]:
    return comments_service.list_admin_comments(db)


@router.patch("/comments/{comment_id}/approve")
def approve_comment(
    comment_id: uuid.UUID,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return comments_service.approve_comment(db, comment_id)


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: uuid.UUID,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return comments_service.delete_comment(db, comment_id)


@router.get("/feedback", response_model=list[FeedbackOut])
def admin_feedback(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> list[FeedbackOut]:
    return feedback_service.list_admin_feedback(db)


@router.patch("/feedback/{feedback_id}/review")
def review_feedback(
    feedback_id: uuid.UUID,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return feedback_service.review_feedback(db, feedback_id)


@router.delete("/feedback/{feedback_id}")
def delete_feedback(
    feedback_id: uuid.UUID,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return feedback_service.delete_feedback(db, feedback_id)


@router.get("/faqs", response_model=list[FaqOut])
def admin_faqs(
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> list[FaqOut]:
    rows = faqs_service.list_all_faqs(db)
    return [FaqOut.model_validate(r) for r in rows]


@router.post("/faqs")
def create_faq(
    payload: FaqCreate,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return faqs_service.create_faq(db, payload)


@router.put("/faqs/{faq_id}")
def update_faq(
    faq_id: uuid.UUID,
    payload: FaqUpdate,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return faqs_service.update_faq(db, faq_id, payload)


@router.delete("/faqs/{faq_id}")
def delete_faq(
    faq_id: uuid.UUID,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return faqs_service.delete_faq(db, faq_id)


@router.delete("/articles/{article_id}")
def delete_article(
    article_id: uuid.UUID,
    _: Annotated[User, Depends(require_staff)],
    db: Session = Depends(get_db),
) -> dict:
    return articles_service.delete_article(db, article_id)


@router.get("/settings", response_model=list[SiteSettingOut])
def admin_settings(
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> list[SiteSettingOut]:
    rows = settings_service.list_settings(db)
    return [SiteSettingOut.model_validate(r) for r in rows]


@router.put("/settings")
def update_settings(
    payload: SettingsBulkUpdate,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return settings_service.update_settings(db, payload.values)


@router.post("/users")
def create_user(
    payload: AdminCreateUserRequest,
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return admin_service.create_user(db, payload)


@router.get("/users", response_model=list[AdminUserOut])
def admin_users(
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> list[AdminUserOut]:
    rows = admin_service.list_users(db)
    return [
        AdminUserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            roles=u.role_values(),
            is_active=u.is_active,
            created_at=u.created_at,
        )
        for u in rows
    ]


@router.put("/users/{user_id}/role")
def set_user_role(
    user_id: uuid.UUID,
    payload: SetUserRoleRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    return admin_service.set_user_role(db, actor=current_user, user_id=user_id, role=payload.role)


@router.post("/seed")
def seed_data(
    _: Annotated[User, Depends(require_admin)],
    db: Session = Depends(get_db),
) -> dict:
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seed is disabled in production",
        )
    result = run_seed(db)
    return {"ok": True, "data": result}
