from app.services.contact import validate_contact


class _Payload:
    def __init__(self, name: str, phone: str, message: str) -> None:
        self.name = name
        self.phone = phone
        self.message = message


def test_validate_contact_ok() -> None:
    result = validate_contact(
        _Payload(
            name="علی احمدی",
            phone="+93 70 000 0000",
            message="سلام، درباره حواله یوان سوال دارم.",
        )  # type: ignore[arg-type]
    )
    assert result["ok"] is True
    assert "علی احمدی" in result["data"]["text"]


def test_validate_contact_field_errors() -> None:
    result = validate_contact(_Payload(name=" ا ", phone=" 12 ", message=" کوتاه ")  # type: ignore[arg-type]
    )
    assert result["ok"] is False
    assert "fieldErrors" in result
