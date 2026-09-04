import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.user import AppRole, User, UserRole
from app.schemas.auth import AuthUserResponse


class AuthError(Exception):
    def __init__(self, detail: str, status_code: int = 401, field_errors: dict[str, str] | None = None):
        self.detail = detail
        self.status_code = status_code
        self.field_errors = field_errors
        super().__init__(detail)


def user_to_response(user: User) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        roles=user.role_values(),
    )


def issue_tokens(user: User) -> tuple[str, str]:
    access = create_access_token(str(user.id), extra={"roles": user.role_values()})
    refresh = create_refresh_token(str(user.id))
    return access, refresh


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def signup_user(
    db: Session,
    *,
    email: str,
    password: str,
    full_name: str | None,
    phone: str | None,
) -> tuple[User, str, str]:
    existing = get_user_by_email(db, email)
    if existing:
        raise AuthError(
            "این ایمیل قبلاً ثبت شده است. وارد شوید.",
            status_code=400,
            field_errors={"email": "validation.emailAlreadyRegistered"},
        )

    user = User(
        email=email.lower().strip(),
        password_hash=hash_password(password),
        full_name=(full_name or "").strip() or None,
        phone=(phone or "").strip() or None,
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.add(UserRole(user_id=user.id, role=AppRole.CUSTOMER))
    db.commit()
    db.refresh(user)

    access, refresh = issue_tokens(user)
    return user, access, refresh


def authenticate_user(db: Session, email: str, password: str) -> tuple[User, str, str]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise AuthError("ایمیل یا رمز عبور نادرست است", status_code=401)
    if not user.is_active:
        raise AuthError("حساب کاربری غیرفعال است", status_code=403)

    access, refresh = issue_tokens(user)
    return user, access, refresh


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)
