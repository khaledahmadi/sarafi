from unittest.mock import MagicMock
from uuid import uuid4

from app.models.user import AppRole
from app.schemas.auth import AdminCreateUserRequest
from app.services.admin import create_user, set_user_role


def test_create_user_request_defaults_to_staff() -> None:
    payload = AdminCreateUserRequest(
        email="expert@sarafi.local",
        password="Secret1",
        full_name="کارشناس تست",
    )
    assert payload.role is AppRole.STAFF


def test_create_user_rejects_duplicate_email(monkeypatch) -> None:
    existing = MagicMock()
    monkeypatch.setattr("app.services.admin.get_user_by_email", lambda _db, _email: existing)
    result = create_user(
        MagicMock(),
        AdminCreateUserRequest(
            email="admin@sarafi.local",
            password="Secret1",
            full_name="کاربر تکراری",
            role=AppRole.STAFF,
        ),
    )
    assert result["ok"] is False
    assert result["fieldErrors"]["email"]


def test_create_user_rejects_admin_role() -> None:
    result = create_user(
        MagicMock(),
        AdminCreateUserRequest(
            email="second-admin@sarafi.local",
            password="Secret1",
            full_name="مدیر دوم",
            role=AppRole.ADMIN,
        ),
    )
    assert result["ok"] is False
    assert result["fieldErrors"]["role"]


def test_create_user_assigns_staff_role(monkeypatch) -> None:
    monkeypatch.setattr("app.services.admin.get_user_by_email", lambda _db, _email: None)
    monkeypatch.setattr("app.services.admin.hash_password", lambda password: f"hashed:{password}")

    db = MagicMock()
    captured: dict[str, object] = {}

    def add(obj: object) -> None:
        captured.setdefault("added", []).append(obj)  # type: ignore[union-attr]
        if hasattr(obj, "id") and getattr(obj, "id", None) is None:
            obj.id = uuid4()

    db.add.side_effect = add

    result = create_user(
        db,
        AdminCreateUserRequest(
            email="expert@sarafi.local",
            password="Secret1",
            full_name="کارشناس جدید",
            role=AppRole.STAFF,
        ),
    )

    assert result["ok"] is True
    added = captured["added"]
    assert any(getattr(item, "role", None) is AppRole.STAFF for item in added)
    db.commit.assert_called_once()


def test_set_user_role_rejects_admin_promotion() -> None:
    actor = MagicMock()
    actor.id = uuid4()
    target = MagicMock()
    target.has_role.return_value = False
    db = MagicMock()
    db.get.return_value = target
    result = set_user_role(db, actor=actor, user_id=uuid4(), role=AppRole.ADMIN)
    assert result["ok"] is False
    db.commit.assert_not_called()
