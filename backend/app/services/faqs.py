import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.faq import Faq
from app.schemas.common import fail_result, ok_result
from app.schemas.faq import FaqCreate, FaqUpdate
from app.services.sanitize import html_to_text


def list_active_faqs(db: Session) -> list[Faq]:
    return list(
        db.scalars(
            select(Faq).where(Faq.is_active.is_(True)).order_by(Faq.sort_order.asc(), Faq.created_at.asc())
        ).all()
    )


def list_all_faqs(db: Session) -> list[Faq]:
    return list(db.scalars(select(Faq).order_by(Faq.sort_order.asc(), Faq.created_at.asc())).all())


def _clean_keywords(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = html_to_text(value)
    return cleaned[:300] or None


def _optional_text(value: str | None, max_len: int) -> str | None:
    if value is None:
        return None
    cleaned = html_to_text(value)
    return cleaned[:max_len] or None


def create_faq(db: Session, payload: FaqCreate) -> dict:
    question = html_to_text(payload.question)
    answer = html_to_text(payload.answer)
    errors: dict[str, str] = {}
    if len(question) < 3:
        errors["question"] = "validation.questionMin"
    if len(answer) < 3:
        errors["answer"] = "validation.answerMin"
    if errors:
        return fail_result("validation.formInvalid", errors)

    row = Faq(
        question=question[:200],
        question_en=_optional_text(payload.question_en, 200),
        question_ps=_optional_text(payload.question_ps, 200),
        answer=answer[:2000],
        answer_en=_optional_text(payload.answer_en, 2000),
        answer_ps=_optional_text(payload.answer_ps, 2000),
        keywords=_clean_keywords(payload.keywords),
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    db.add(row)
    db.commit()
    return ok_result()


def update_faq(db: Session, faq_id: uuid.UUID, payload: FaqUpdate) -> dict:
    row = db.get(Faq, faq_id)
    if not row:
        return fail_result("سؤال یافت نشد")

    data = payload.model_dump(exclude_unset=True)
    if "question" in data and data["question"] is not None:
        question = html_to_text(data["question"])
        if len(question) < 3:
            return fail_result("validation.formInvalid", {"question": "validation.questionMin"})
        data["question"] = question[:200]
    if "answer" in data and data["answer"] is not None:
        answer = html_to_text(data["answer"])
        if len(answer) < 3:
            return fail_result("validation.formInvalid", {"answer": "validation.answerMin"})
        data["answer"] = answer[:2000]
    for field, max_len in (
        ("question_en", 200),
        ("question_ps", 200),
        ("answer_en", 2000),
        ("answer_ps", 2000),
    ):
        if field in data:
            data[field] = _optional_text(data[field], max_len)
    if "keywords" in data:
        data["keywords"] = _clean_keywords(data["keywords"])

    for key, value in data.items():
        setattr(row, key, value)
    db.commit()
    return ok_result()


def delete_faq(db: Session, faq_id: uuid.UUID) -> dict:
    row = db.get(Faq, faq_id)
    if not row:
        return fail_result("سؤال یافت نشد")
    db.delete(row)
    db.commit()
    return ok_result()
