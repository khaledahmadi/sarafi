from app.services.sanitize import html_to_text, sanitize_article_html


def test_sanitize_allows_basic_tags() -> None:
    html = '<p>سلام <strong>دنیا</strong></p><script>alert(1)</script>'
    cleaned = sanitize_article_html(html)
    assert "<strong>" in cleaned
    assert "<script>" not in cleaned
    assert "alert" not in cleaned


def test_html_to_text_strips_tags() -> None:
    assert html_to_text("<p>hello <em>world</em></p>") == "hello world"


def test_sanitize_allows_uploaded_images() -> None:
    src = "/uploads/editor/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg"
    cleaned = sanitize_article_html(f'<p><img src="{src}" alt="نمودار"></p>')
    assert src in cleaned
    assert 'alt="نمودار"' in cleaned


def test_sanitize_strips_unsafe_images() -> None:
    cleaned = sanitize_article_html('<img src="javascript:alert(1)" alt="x"><img src="data:image/png;base64,aaaa">')
    assert "javascript" not in cleaned
    assert "data:" not in cleaned
