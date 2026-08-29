from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class SiteSettingOut(ORMModel):
    key: str
    group_key: str
    label_fa: str
    value: str
    input_kind: str
    hint_fa: str | None = None
    sort_order: int


class SettingValueItem(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    value: str = Field(max_length=8000)


class SettingsBulkUpdate(BaseModel):
    values: list[SettingValueItem] = Field(min_length=1, max_length=80)
