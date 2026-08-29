from decimal import Decimal
from unittest.mock import MagicMock
from uuid import uuid4

from app.schemas.transfer import TransferUpdate
from app.services.transfers import delete_transfer, update_transfer


def _payload(**overrides: object) -> TransferUpdate:
    data = {
        "from_currency": "AFN",
        "to_currency": "CNY",
        "amount": Decimal("1000"),
        "destination_fa": "چین",
        "recipient_name": "احمد سروری",
        "recipient_detail": "حساب بانک چین ۱۲۳",
        "note": "تست",
    }
    data.update(overrides)
    return TransferUpdate.model_validate(data)


def test_update_transfer_writes_fields() -> None:
    row = MagicMock()
    db = MagicMock()
    db.get.return_value = row

    result = update_transfer(db, uuid4(), _payload(amount=Decimal("2500"), destination_fa="چین"))

    assert result["ok"] is True
    assert row.amount == Decimal("2500")
    assert row.destination_fa == "چین"
    db.commit.assert_called_once()


def test_update_transfer_rejects_same_currencies() -> None:
    row = MagicMock()
    db = MagicMock()
    db.get.return_value = row

    result = update_transfer(db, uuid4(), _payload(from_currency="CNY", to_currency="CNY"))

    assert result["ok"] is False
    assert result["fieldErrors"]["to_currency"]
    db.commit.assert_not_called()


def test_update_transfer_missing_row() -> None:
    db = MagicMock()
    db.get.return_value = None
    result = update_transfer(db, uuid4(), _payload())
    assert result["ok"] is False
    db.commit.assert_not_called()


def test_delete_transfer_removes_row() -> None:
    row = MagicMock()
    db = MagicMock()
    db.get.return_value = row

    result = delete_transfer(db, uuid4())

    assert result["ok"] is True
    db.delete.assert_called_once_with(row)
    db.commit.assert_called_once()


def test_delete_transfer_missing_row() -> None:
    db = MagicMock()
    db.get.return_value = None
    result = delete_transfer(db, uuid4())
    assert result["ok"] is False
    db.delete.assert_not_called()
