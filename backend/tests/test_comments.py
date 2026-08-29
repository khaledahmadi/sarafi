from unittest.mock import MagicMock
from uuid import uuid4

from app.schemas.comment import CommentCreate
from app.services.comments import approve_comment, create_comment, delete_comment


def test_create_comment_requires_guest_fields() -> None:
    article = MagicMock()
    article.id = uuid4()
    db = MagicMock()
    db.scalar.return_value = article

    result = create_comment(
        db,
        "havale-yuan",
        CommentCreate(body="نظر خوب بود", guest_name="", guest_email=""),
        user=None,
    )

    assert result["ok"] is False
    assert result["fieldErrors"]["guest_name"]
    assert result["fieldErrors"]["guest_email"]
    db.commit.assert_not_called()


def test_create_comment_guest_ok() -> None:
    article = MagicMock()
    article.id = uuid4()
    db = MagicMock()
    db.scalar.return_value = article

    result = create_comment(
        db,
        "havale-yuan",
        CommentCreate(body="این مقاله مفید بود.", guest_name="علی", guest_email="ali@example.com"),
        user=None,
    )

    assert result["ok"] is True
    db.add.assert_called_once()
    db.commit.assert_called_once()
    row = db.add.call_args[0][0]
    assert row.is_approved is True
    assert row.guest_name == "علی"
    assert row.user_id is None
    assert row.parent_id is None


def test_create_reply_uses_root_parent() -> None:
    article_id = uuid4()
    article = MagicMock()
    article.id = article_id
    root = MagicMock()
    root.id = uuid4()
    root.article_id = article_id
    root.parent_id = None
    child = MagicMock()
    child.id = uuid4()
    child.article_id = article_id
    child.parent_id = root.id

    db = MagicMock()
    db.scalar.return_value = article
    db.get.return_value = child

    result = create_comment(
        db,
        "havale-yuan",
        CommentCreate(body="پاسخ به پاسخ", parent_id=child.id, guest_name="علی", guest_email="ali@example.com"),
        user=None,
    )

    assert result["ok"] is True
    row = db.add.call_args[0][0]
    assert row.parent_id == root.id


def test_create_reply_rejects_foreign_parent() -> None:
    article = MagicMock()
    article.id = uuid4()
    parent = MagicMock()
    parent.id = uuid4()
    parent.article_id = uuid4()
    db = MagicMock()
    db.scalar.return_value = article
    db.get.return_value = parent

    result = create_comment(
        db,
        "havale-yuan",
        CommentCreate(body="پاسخ", parent_id=parent.id, guest_name="علی", guest_email="ali@example.com"),
        user=None,
    )

    assert result["ok"] is False
    db.add.assert_not_called()


def test_create_comment_logged_in_skips_guest_fields() -> None:
    article = MagicMock()
    article.id = uuid4()
    user = MagicMock()
    user.id = uuid4()
    db = MagicMock()
    db.scalar.return_value = article

    result = create_comment(
        db,
        "havale-yuan",
        CommentCreate(body="نظر ثبت‌شده"),
        user=user,
    )

    assert result["ok"] is True
    row = db.add.call_args[0][0]
    assert row.user_id == user.id
    assert row.guest_name is None


def test_create_comment_missing_article() -> None:
    db = MagicMock()
    db.scalar.return_value = None
    result = create_comment(db, "missing", CommentCreate(body="متن"), user=None)
    assert result["ok"] is False
    db.add.assert_not_called()


def test_approve_and_delete_comment() -> None:
    row = MagicMock()
    db = MagicMock()
    db.get.return_value = row

    assert approve_comment(db, uuid4())["ok"] is True
    assert row.is_approved is True

    assert delete_comment(db, uuid4())["ok"] is True
    db.delete.assert_called_once_with(row)


def test_approve_missing_comment() -> None:
    db = MagicMock()
    db.get.return_value = None
    assert approve_comment(db, uuid4())["ok"] is False
