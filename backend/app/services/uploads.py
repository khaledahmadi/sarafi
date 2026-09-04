import re
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.schemas.common import fail_result, ok_result

MAX_IMAGE_BYTES = 5 * 1024 * 1024
EDITOR_SUBDIR = "editor"
UPLOAD_URL_PREFIX = f"/uploads/{EDITOR_SUBDIR}/"
SAFE_FILENAME = re.compile(r"^[a-f0-9-]{36}\.(jpg|jpeg|png|webp|gif)$")

_MAGIC_TYPES: list[tuple[bytes, str, str]] = [
    (b"\xff\xd8\xff", "image/jpeg", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", ".png"),
    (b"GIF87a", "image/gif", ".gif"),
    (b"GIF89a", "image/gif", ".gif"),
]


def upload_dir() -> Path:
    path = Path(settings.UPLOAD_DIR)
    if not path.is_absolute():
        path = Path.cwd() / path
    path.mkdir(parents=True, exist_ok=True)
    (path / EDITOR_SUBDIR).mkdir(parents=True, exist_ok=True)
    return path


def sniff_image(data: bytes) -> tuple[str, str] | None:
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp", ".webp"
    for magic, mime, ext in _MAGIC_TYPES:
        if data.startswith(magic):
            return mime, ext
    return None


def is_safe_upload_src(value: str) -> bool:
    src = value.strip()
    if src.startswith(UPLOAD_URL_PREFIX):
        return bool(SAFE_FILENAME.fullmatch(src.removeprefix(UPLOAD_URL_PREFIX)))
    if src.startswith("/api/v1/uploads/"):
        name = src.removeprefix("/api/v1/uploads/")
        return bool(re.fullmatch(r"^[a-f0-9-]{36}(?:\.(?:jpg|jpeg|png|webp|gif))?$", name))
    return False


def save_image(file: UploadFile) -> dict:
    data = file.file.read(MAX_IMAGE_BYTES + 1)
    if not data:
        return fail_result("media.emptyImage")
    if len(data) > MAX_IMAGE_BYTES:
        return fail_result("media.maxSize")

    sniffed = sniff_image(data)
    if sniffed is None:
        return fail_result("media.invalidType")

    _mime, ext = sniffed
    filename = f"{uuid.uuid4()}{ext}"
    dest = upload_dir() / EDITOR_SUBDIR / filename
    dest.write_bytes(data)
    return ok_result({"url": f"{UPLOAD_URL_PREFIX}{filename}"})
