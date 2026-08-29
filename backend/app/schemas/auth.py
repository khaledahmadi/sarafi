import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.user import AppRole
from app.schemas.common import ORMModel
from app.schemas.types import EmailAddress


class SignupRequest(BaseModel):
    email: EmailAddress
    password: str = Field(min_length=6, max_length=72)
    full_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=64)


class LoginRequest(BaseModel):
    email: EmailAddress
    password: str = Field(min_length=1, max_length=72)


class UserOut(ORMModel):
    id: uuid.UUID
    email: EmailAddress
    full_name: str | None = None
    phone: str | None = None
    roles: list[str] = []


class AuthUserResponse(BaseModel):
    id: uuid.UUID
    email: EmailAddress
    full_name: str | None = None
    phone: str | None = None
    roles: list[str]


class AuthLoginResponse(AuthUserResponse):
    access_token: str


class RolesResponse(BaseModel):
    roles: list[str]


class AdminUserOut(ORMModel):
    id: uuid.UUID
    email: EmailAddress
    full_name: str | None = None
    phone: str | None = None
    roles: list[str] = []
    is_active: bool
    created_at: datetime


class SetUserRoleRequest(BaseModel):
    role: AppRole


class AdminCreateUserRequest(BaseModel):
    email: EmailAddress
    password: str = Field(min_length=6, max_length=72)
    full_name: str = Field(min_length=3, max_length=255)
    phone: str | None = Field(default=None, max_length=64)
    role: AppRole = AppRole.STAFF
