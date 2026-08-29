from unittest.mock import MagicMock
from uuid import uuid4

from app.models.feedback import FeedbackStatus
from app.schemas.feedback import FeedbackCreate
from app.services.feedback import create_feedback, delete_feedback, review_feedback


def test_create_feedback_logged_in() -> None:
    user = MagicMock()
    user.id = uuid4()
    db = MagicMock()

    result = create_feedback(
        db,
        FeedbackCreate(body="سرعت انجام کار خوب بود.", rating=5),
        user,
    )

    assert result["ok"] is True
    db.add.assert_called_once()
    db.commit.assert_called_once()
    row = db.add.call_args[0][0]
    assert row.user_id == user.id
    assert row.guest_name is None
    assert row.rating == 5
    assert row.status == FeedbackStatus.PENDING


def test_create_feedback_guest_ok() -> None:
    db = MagicMock()
    result = create_feedback(
        db,
        FeedbackCreate(
            body="پاسخگویی خوب بود.",
            rating=4,
            guest_name="علی",
            guest_email="ali@example.com",
        ),
        user=None,
    )

    assert result["ok"] is True
    row = db.add.call_args[0][0]
    assert row.user_id is None
    assert row.guest_name == "علی"
    assert row.guest_email == "ali@example.com"


def test_create_feedback_guest_requires_name_and_email() -> None:
    db = MagicMock()
    result = create_feedback(
        db,
        FeedbackCreate(body="متن بازخورد", rating=5, guest_name="", guest_email=""),
        user=None,
    )
    assert result["ok"] is False
    assert result["fieldErrors"]["guest_name"]
    assert result["fieldErrors"]["guest_email"]
    db.add.assert_not_called()


def test_create_feedback_rejects_empty_body() -> None:
    db = MagicMock()
    result = create_feedback(
        db,
        FeedbackCreate(body="<p>   </p>", rating=4),
        MagicMock(id=uuid4()),
    )
    assert result["ok"] is False
    assert result["fieldErrors"]["body"]
    db.add.assert_not_called()


def test_review_and_delete_feedback() -> None:
    row = MagicMock()
    db = MagicMock()
    db.get.return_value = row

    assert review_feedback(db, uuid4())["ok"] is True
    assert row.status == FeedbackStatus.REVIEWED

    assert delete_feedback(db, uuid4())["ok"] is True
    db.delete.assert_called_once_with(row)


def test_review_missing_feedback() -> None:
    db = MagicMock()
    db.get.return_value = None
    assert review_feedback(db, uuid4())["ok"] is False
