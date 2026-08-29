from starlette.responses import Response

from app.api.deps_cookie import clear_auth_cookies, set_auth_cookies
from app.core.config import settings


def test_set_auth_cookies_emits_single_refresh_cookie() -> None:
    response = Response()
    set_auth_cookies(response, access_token="access.jwt", refresh_token="refresh.jwt")

    # Starlette stores cookies in raw_headers as multiple set-cookie values.
    set_cookies = [
        v.decode() if isinstance(v, bytes) else v
        for k, v in response.raw_headers
        if k.lower() == b"set-cookie"
    ]
    assert len(set_cookies) == 1
    assert set_cookies[0].startswith(f"{settings.REFRESH_COOKIE_NAME}=refresh.jwt")
    assert "HttpOnly" in set_cookies[0]
    assert settings.ACCESS_COOKIE_NAME not in set_cookies[0]


def test_clear_auth_cookies_clears_refresh_only() -> None:
    response = Response()
    clear_auth_cookies(response)
    set_cookies = [
        v.decode() if isinstance(v, bytes) else v
        for k, v in response.raw_headers
        if k.lower() == b"set-cookie"
    ]
    assert len(set_cookies) == 1
    assert settings.REFRESH_COOKIE_NAME in set_cookies[0]
