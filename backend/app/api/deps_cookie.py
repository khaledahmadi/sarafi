from fastapi import Response

from app.core.config import settings


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """
    Set exactly one Set-Cookie (refresh).

    Access tokens are returned in JSON and sent as Bearer by the SPA.
    The TanStack Start / Nitro same-origin proxy keeps only a single Set-Cookie
    header; any additional set/delete_cookie calls drop the refresh cookie and
    break session restore after reload.
    """
    del access_token  # delivered via AuthLoginResponse.access_token
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear refresh cookie only (single Set-Cookie through the frontend proxy)."""
    response.delete_cookie(settings.REFRESH_COOKIE_NAME, path="/")
