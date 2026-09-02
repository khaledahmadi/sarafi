import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.rate_sources import get_rate_source, normalize_rate_source
from app.models.currency import Currency
from app.schemas.currency import CurrencyCreate, CurrencyUpdate


def list_active_currencies(db: Session, *, rate_source: str) -> list[Currency]:
    source = normalize_rate_source(rate_source)
    return list(
        db.scalars(
            select(Currency)
            .where(Currency.is_active.is_(True), Currency.rate_source == source)
            .order_by(Currency.sort_order.asc(), Currency.code.asc())
        ).all()
    )


def list_all_currencies(db: Session, *, rate_source: str | None = None) -> list[Currency]:
    query = select(Currency)
    if rate_source is not None:
        query = query.where(Currency.rate_source == normalize_rate_source(rate_source))
    return list(
        db.scalars(query.order_by(Currency.sort_order.asc(), Currency.code.asc())).all()
    )


DUPLICATE_CODE_ERROR = {
    "ok": False,
    "message": "این کد ارز قبلاً ثبت شده است",
    "fieldErrors": {"code": "این کد ارز قبلاً ثبت شده است"},
}


def _code_taken(
    db: Session,
    code: str,
    *,
    rate_source: str,
    exclude_id: uuid.UUID | None = None,
) -> bool:
    query = select(Currency.id).where(
        func.upper(Currency.code) == code.upper(),
        Currency.rate_source == rate_source,
    )
    if exclude_id is not None:
        query = query.where(Currency.id != exclude_id)
    return db.scalar(query) is not None


def _validate_rates(buy_rate: Decimal, sell_rate: Decimal) -> dict | None:
    if sell_rate < buy_rate:
        return {
            "ok": False,
            "message": "نرخ فروش نمی‌تواند کمتر از نرخ خرید باشد",
            "fieldErrors": {"sell_rate": "نرخ فروش نمی‌تواند کمتر از نرخ خرید باشد"},
        }
    return None


def create_currency(db: Session, payload: CurrencyCreate) -> dict:
    err = _validate_rates(payload.buy_rate, payload.sell_rate)
    if err:
        return err
    rate_source = normalize_rate_source(payload.rate_source)
    get_rate_source(rate_source)
    if _code_taken(db, payload.code, rate_source=rate_source):
        return DUPLICATE_CODE_ERROR

    row = Currency(
        rate_source=rate_source,
        code=payload.code.upper(),
        name_fa=payload.name_fa.strip(),
        name_en=(payload.name_en or "").strip() or None,
        name_ps=(payload.name_ps or "").strip() or None,
        flag=(payload.flag or "").strip() or None,
        buy_rate=payload.buy_rate,
        sell_rate=payload.sell_rate,
        is_active=payload.is_active,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return DUPLICATE_CODE_ERROR
    return {"ok": True}


def update_currency(db: Session, currency_id: uuid.UUID, payload: CurrencyUpdate) -> dict:
    row = db.get(Currency, currency_id)
    if not row:
        return {"ok": False, "message": "ارز یافت نشد"}

    data = payload.model_dump(exclude_unset=True)
    if "code" in data and data["code"] is not None:
        data["code"] = data["code"].upper()
        if _code_taken(db, data["code"], rate_source=row.rate_source, exclude_id=currency_id):
            return DUPLICATE_CODE_ERROR
    if "name_fa" in data and data["name_fa"] is not None:
        data["name_fa"] = data["name_fa"].strip()
    if "name_en" in data:
        data["name_en"] = (data["name_en"] or "").strip() or None
    if "name_ps" in data:
        data["name_ps"] = (data["name_ps"] or "").strip() or None
    if "flag" in data:
        data["flag"] = (data["flag"] or "").strip() or None

    buy = data.get("buy_rate", row.buy_rate)
    sell = data.get("sell_rate", row.sell_rate)
    err = _validate_rates(Decimal(buy), Decimal(sell))
    if err:
        return err

    for key, value in data.items():
        setattr(row, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return DUPLICATE_CODE_ERROR
    return {"ok": True}


def delete_currency(db: Session, currency_id: uuid.UUID) -> dict:
    row = db.get(Currency, currency_id)
    if not row:
        return {"ok": False, "message": "ارز یافت نشد"}
    db.delete(row)
    db.commit()
    return {"ok": True}
