import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.branch import Branch
from app.schemas.branch import BranchCreate, BranchUpdate


def _empty_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


def list_branches(db: Session) -> list[Branch]:
    return list(db.scalars(select(Branch).order_by(Branch.sort_order.asc())).all())


def create_branch(db: Session, payload: BranchCreate) -> dict:
    row = Branch(
        name_fa=payload.name_fa.strip(),
        city_fa=payload.city_fa.strip(),
        country_fa=payload.country_fa.strip(),
        address_fa=_empty_to_none(payload.address_fa),
        phone=_empty_to_none(payload.phone),
        whatsapp=_empty_to_none(payload.whatsapp),
        map_url=_empty_to_none(payload.map_url),
        sort_order=payload.sort_order,
    )
    db.add(row)
    db.commit()
    return {"ok": True}


def update_branch(db: Session, branch_id: uuid.UUID, payload: BranchUpdate) -> dict:
    row = db.get(Branch, branch_id)
    if not row:
        return {"ok": False, "message": "نمایندگی یافت نشد"}

    data = payload.model_dump(exclude_unset=True)
    for key in ("name_fa", "city_fa", "country_fa"):
        if key in data and data[key] is not None:
            data[key] = data[key].strip()
    for key in ("address_fa", "phone", "whatsapp", "map_url"):
        if key in data:
            data[key] = _empty_to_none(data[key])

    for key, value in data.items():
        setattr(row, key, value)

    db.commit()
    return {"ok": True}


def delete_branch(db: Session, branch_id: uuid.UUID) -> dict:
    row = db.get(Branch, branch_id)
    if not row:
        return {"ok": False, "message": "نمایندگی یافت نشد"}
    db.delete(row)
    db.commit()
    return {"ok": True}
