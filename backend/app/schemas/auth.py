from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    locale: str
    theme: str


class AuthResponse(BaseModel):
    user: UserOut
    access_token: str


class PreferencesUpdate(BaseModel):
    locale: str | None = None
    theme: str | None = None
    name: str | None = None
