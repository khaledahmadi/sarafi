from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ActionResult(BaseModel, Generic[T]):
    ok: bool
    data: T | None = None
    message: str | None = None
    fieldErrors: dict[str, str] | None = None


def ok_result(data: Any = None) -> dict[str, Any]:
    if data is None:
        return {"ok": True}
    return {"ok": True, "data": data}


def fail_result(
    message: str,
    field_errors: dict[str, str] | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {"ok": False, "message": message}
    if field_errors:
        result["fieldErrors"] = field_errors
    return result


class MessageOut(BaseModel):
    detail: str = Field(..., examples=["ok"])
