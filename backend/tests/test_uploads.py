from io import BytesIO

from starlette.datastructures import Headers, UploadFile

from app.services.uploads import save_image, sniff_image


PNG_HEADER = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


def test_sniff_png() -> None:
    assert sniff_image(PNG_HEADER) == ("image/png", ".png")


def test_sniff_rejects_text() -> None:
    assert sniff_image(b"not-an-image") is None


def test_save_image_writes_png(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr("app.services.uploads.settings.UPLOAD_DIR", str(tmp_path))
    upload = UploadFile(
        file=BytesIO(PNG_HEADER),
        filename="chart.png",
        headers=Headers({"content-type": "image/png"}),
    )
    result = save_image(upload)
    assert result["ok"] is True
    filename = result["data"]["url"].rsplit("/", 1)[-1]
    assert result["data"]["url"] == f"/uploads/editor/{filename}"
    saved = tmp_path / "editor" / filename
    assert saved.is_file()
    assert saved.read_bytes().startswith(b"\x89PNG")
