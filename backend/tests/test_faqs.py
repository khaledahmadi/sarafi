from unittest.mock import MagicMock
from uuid import uuid4

from app.schemas.faq import FaqCreate, FaqUpdate
from app.services.faqs import create_faq, delete_faq, update_faq


def test_create_faq_ok() -> None:
    db = MagicMock()
    result = create_faq(
        db,
        FaqCreate(question="نرخ دلار چند است؟", answer="نرخ روز در صفحه نرخ لحظه‌ای دیده می‌شود.", keywords="دلار، نرخ"),
    )
    assert result["ok"] is True
    db.add.assert_called_once()
    row = db.add.call_args[0][0]
    assert row.question.startswith("نرخ")
    assert row.is_active is True


def test_create_faq_rejects_empty_question() -> None:
    db = MagicMock()
    result = create_faq(db, FaqCreate(question="<p>  </p>", answer="پاسخ معتبر است"))
    assert result["ok"] is False
    assert result["fieldErrors"]["question"]
    db.add.assert_not_called()


def test_update_and_delete_faq() -> None:
    row = MagicMock()
    db = MagicMock()
    db.get.return_value = row

    assert update_faq(db, uuid4(), FaqUpdate(is_active=False))["ok"] is True
    assert row.is_active is False

    assert delete_faq(db, uuid4())["ok"] is True
    db.delete.assert_called_once_with(row)
