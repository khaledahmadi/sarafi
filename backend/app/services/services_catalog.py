import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate


def list_active_services(db: Session) -> list[Service]:
    return list(
        db.scalars(
            select(Service).where(Service.is_active.is_(True)).order_by(Service.sort_order.asc())
        ).all()
    )


def list_all_services(db: Session) -> list[Service]:
    return list(db.scalars(select(Service).order_by(Service.sort_order.asc())).all())


def create_service(db: Session, payload: ServiceCreate) -> dict:
    row = Service(
        slug=payload.slug.strip(),
        title_fa=payload.title_fa.strip(),
        summary_fa=payload.summary_fa.strip(),
        icon=payload.icon.strip(),
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {
            "ok": False,
            "message": "این نشانی خدمت قبلاً ثبت شده است",
            "fieldErrors": {"slug": "این نشانی قبلاً استفاده شده است"},
        }
    return {"ok": True}


def update_service(db: Session, service_id: uuid.UUID, payload: ServiceUpdate) -> dict:
    row = db.get(Service, service_id)
    if not row:
        return {"ok": False, "message": "خدمت یافت نشد"}

    data = payload.model_dump(exclude_unset=True)
    for key in ("slug", "title_fa", "summary_fa", "icon"):
        if key in data and data[key] is not None:
            data[key] = data[key].strip()

    for key, value in data.items():
        setattr(row, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {
            "ok": False,
            "message": "این نشانی خدمت قبلاً ثبت شده است",
            "fieldErrors": {"slug": "این نشانی قبلاً استفاده شده است"},
        }
    return {"ok": True}


def delete_service(db: Session, service_id: uuid.UUID) -> dict:
    row = db.get(Service, service_id)
    if not row:
        return {"ok": False, "message": "خدمت یافت نشد"}
    db.delete(row)
    db.commit()
    return {"ok": True}
