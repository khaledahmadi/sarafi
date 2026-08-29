import uuid
from typing import Annotated

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps_cookie import clear_auth_cookies, set_auth_cookies
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_user_optional
from app.core.security import decode_token
from app.models.user import User
from app.schemas.auth import (
    AuthLoginResponse,
    AuthUserResponse,
    LoginRequest,
    RolesResponse,
    SignupRequest,
)
from app.schemas.common import fail_result
from app.services import auth as auth_service
from app.services.auth import AuthError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
def signup(
    payload: SignupRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthLoginResponse | dict:
    try:
        user, access, refresh = auth_service.signup_user(
            db,
            email=str(payload.email),
            password=payload.password,
            full_name=payload.full_name,
            phone=payload.phone,
        )
    except AuthError as exc:
        if exc.status_code == 400:
            return fail_result(exc.detail, exc.field_errors)
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    set_auth_cookies(response, access, refresh)
    user_payload = auth_service.user_to_response(user)
    return AuthLoginResponse(**user_payload.model_dump(), access_token=access)


@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthLoginResponse:
    try:
        user, access, refresh = auth_service.authenticate_user(
            db, str(payload.email), payload.password
        )
    except AuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    set_auth_cookies(response, access, refresh)
    user_payload = auth_service.user_to_response(user)
    return AuthLoginResponse(**user_payload.model_dump(), access_token=access)


@router.post("/logout")
def logout(response: Response) -> dict:
    clear_auth_cookies(response)
    return {"ok": True}


@router.post("/refresh")
def refresh(
    response: Response,
    refresh_token: Annotated[str | None, Cookie(alias=settings.REFRESH_COOKIE_NAME)] = None,
    db: Session = Depends(get_db),
) -> AuthLoginResponse:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")
    try:
        payload = decode_token(refresh_token)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        ) from exc

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    try:
        uid = uuid.UUID(str(user_id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        ) from exc

    user = db.get(User, uid)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access, new_refresh = auth_service.issue_tokens(user)
    set_auth_cookies(response, access, new_refresh)
    user_payload = auth_service.user_to_response(user)
    return AuthLoginResponse(**user_payload.model_dump(), access_token=access)


@router.get("/session")
def session(
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> dict:
    """Soft session probe — 200 with user or null (no 401 when logged out)."""
    if current_user is None:
        return {"user": None}
    payload = auth_service.user_to_response(current_user)
    return {"user": payload.model_dump(mode="json")}


@router.get("/me", response_model=AuthUserResponse)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> AuthUserResponse:
    return auth_service.user_to_response(current_user)


@router.get("/roles", response_model=RolesResponse)
def roles(current_user: Annotated[User, Depends(get_current_user)]) -> RolesResponse:
    return RolesResponse(roles=current_user.role_values())
