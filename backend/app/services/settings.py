from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.site_setting import SiteSetting
from app.schemas.settings import SettingValueItem


def list_settings(db: Session) -> list[SiteSetting]:
    return list(
        db.scalars(
            select(SiteSetting).order_by(SiteSetting.group_key.asc(), SiteSetting.sort_order.asc())
        ).all()
    )


def update_settings(db: Session, values: list[SettingValueItem]) -> dict:
    for item in values:
        row = db.get(SiteSetting, item.key)
        if not row:
            return {"ok": False, "message": f"کلید تنظیمات یافت نشد: {item.key}"}
        row.value = item.value
    db.commit()
    return {"ok": True}
