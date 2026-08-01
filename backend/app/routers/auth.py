from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..deps import get_current_user, get_locale
from ..db import get_session
from ..i18n import t
from ..models import User
from ..schemas.auth import (
    AuthResponse,
    LoginRequest,
    PreferencesUpdate,
    RegisterRequest,
    UserOut,
)
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        locale=user.locale,
        theme=user.theme,
    )


@router.post("/login", response_model=AuthResponse)
def login(
    body: LoginRequest,
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    user = session.exec(select(User).where(User.email == body.email.lower())).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, t("invalid_credentials", locale))
    token = create_access_token(str(user.id), {"role": user.role})
    return AuthResponse(user=_user_out(user), access_token=token)


@router.post("/register", response_model=AuthResponse)
def register(
    body: RegisterRequest,
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    email = body.email.lower()
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, t("email_taken", locale))
    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        role="member",
        locale=locale,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    # Give the new account a ready-to-use starter workspace so Otto has data to
    # act on immediately (contacts, deals, tasks, notes, docs; web index is global).
    try:
        from ..seed import _seed_web, _seed_workspace

        _seed_web(session)
        _seed_workspace(session, user.id)
    except Exception:  # noqa: BLE001 - seeding must never block account creation
        session.rollback()
    token = create_access_token(str(user.id), {"role": user.role})
    return AuthResponse(user=_user_out(user), access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _user_out(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: PreferencesUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if body.locale in ("en", "es", "pt"):
        user.locale = body.locale
    if body.theme in ("light", "dark"):
        user.theme = body.theme
    if body.name and body.name.strip():
        user.name = body.name.strip()
    session.add(user)
    session.commit()
    session.refresh(user)
    return _user_out(user)
