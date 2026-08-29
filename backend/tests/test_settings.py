from unittest.mock import MagicMock

from app.schemas.settings import SettingValueItem
from app.services.settings import update_settings


def test_update_settings_writes_value() -> None:
    row = MagicMock()
    db = MagicMock()
    db.get.return_value = row

    result = update_settings(db, [SettingValueItem(key="home.stat1_value", value="۱۴+")])

    assert result["ok"] is True
    assert row.value == "۱۴+"
    db.commit.assert_called_once()


def test_update_settings_missing_key() -> None:
    db = MagicMock()
    db.get.return_value = None

    result = update_settings(db, [SettingValueItem(key="home.missing", value="x")])

    assert result["ok"] is False
    db.commit.assert_not_called()
