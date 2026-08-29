from app.schemas.contact import ContactValidateRequest


def validate_contact(payload: ContactValidateRequest) -> dict:
    name = payload.name.strip()
    phone = payload.phone.strip()
    message = payload.message.strip()

    field_errors: dict[str, str] = {}
    if len(name) < 2:
        field_errors["name"] = "نام و تخلص را وارد کنید"
    if len(phone) < 6:
        field_errors["phone"] = "شماره تماس معتبر وارد کنید"
    if len(message) < 10:
        field_errors["message"] = "متن پیام حداقل ۱۰ حرف باشد"

    if field_errors:
        return {
            "ok": False,
            "message": next(iter(field_errors.values())),
            "fieldErrors": field_errors,
        }

    text = f"سلام، {name} هستم.\nشماره تماس: {phone}\n{message}"
    return {"ok": True, "data": {"text": text}}
