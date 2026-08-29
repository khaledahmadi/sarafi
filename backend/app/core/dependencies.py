import uuid
from typing import Annotated, Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import AppRole, User

security = HTTPBearer(auto_error=False)


def _credentials_error() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


def _extract_access_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials],
) -> str | None:
    # Prefer Authorization Bearer (survives proxies that drop one Set-Cookie).
    if credentials and credentials.scheme.lower() == "bearer" and credentials.credentials:
        return credentials.credentials
    return request.cookies.get(settings.ACCESS_COOKIE_NAME)


def _load_user_from_access_token(
    access_token: str | None,
    db: Session,
    *,
    required: bool,
) -> User | None:
    if not access_token:
        if required:
            raise _credentials_error()
        return None
    try:
        payload = decode_token(access_token)
    except jwt.ExpiredSignatureError:
        if required:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
        return None
    except jwt.PyJWTError:
        if required:
            raise _credentials_error()
        return None

    if payload.get("type") != "access":
        if required:
            raise _credentials_error()
        return None

    user_id = payload.get("sub")
    if not user_id:
        if required:
            raise _credentials_error()
        return None

    try:
        uid = uuid.UUID(str(user_id))
    except ValueError:
        if required:
            raise _credentials_error()
        return None

    user = db.get(User, uid)
    if not user or not user.is_active:
        if required:
            raise _credentials_error()
        return None
    return user


def get_current_user(
    request: Request,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
    db: Session = Depends(get_db),
) -> User:
    token = _extract_access_token(request, credentials)
    user = _load_user_from_access_token(token, db, required=True)
    assert user is not None
    return user


def get_current_user_optional(
    request: Request,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
    db: Session = Depends(get_db),
) -> User | None:
    token = _extract_access_token(request, credentials)
    return _load_user_from_access_token(token, db, required=False)


def require_staff(user: Annotated[User, Depends(get_current_user)]) -> User:
    if not user.has_role(AppRole.ADMIN, AppRole.STAFF):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    return user


def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if not user.has_role(AppRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
