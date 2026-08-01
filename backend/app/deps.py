from fastapi import Depends, Header, HTTPException, Request, status
from sqlmodel import Session

from .db import get_session
from .i18n import resolve_locale, t
from .models import User
from .security import decode_token


def get_locale(request: Request) -> str:
    return resolve_locale(request)


def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
) -> User:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, t("not_authenticated", locale))
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, t("not_authenticated", locale))
    user = session.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, t("not_authenticated", locale))
    return user


def require_admin(
    user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
) -> User:
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, t("forbidden", locale))
    return user
