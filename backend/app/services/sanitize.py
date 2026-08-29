import re
from urllib.parse import urlparse

import bleach

from app.services.uploads import is_safe_upload_src

ALLOWED_TAGS = ["p", "br", "strong", "em", "ul", "ol", "li", "a", "h2", "h3", "blockquote", "img"]
_DANGEROUS_BLOCKS = re.compile(
    r"<(script|style|iframe|object|embed)[^>]*>.*?</\1>",
    re.IGNORECASE | re.DOTALL,
)


def _allowed_img_attr(tag: str, name: str, value: str) -> bool:
    if tag != "img":
        return False
    if name in {"alt", "class", "title"}:
        return True
    if name != "src":
        return False
    if is_safe_upload_src(value):
        return True
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


ALLOWED_ATTRIBUTES = {
    "a": ["href", "title", "rel", "target"],
    "img": _allowed_img_attr,
}


def sanitize_article_html(html: str) -> str:
    without_blocks = _DANGEROUS_BLOCKS.sub("", html)
    return bleach.clean(
        without_blocks,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,
    )


def html_to_text(html: str) -> str:
    text = bleach.clean(html, tags=[], strip=True)
    return re.sub(r"\s+", " ", text).strip()
