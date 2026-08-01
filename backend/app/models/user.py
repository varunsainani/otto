from datetime import datetime

from sqlmodel import Field, SQLModel

from ..util import now_utc


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    password_hash: str
    role: str = Field(default="member")  # member | admin
    locale: str = Field(default="en")
    theme: str = Field(default="dark")
    created_at: datetime = Field(default_factory=now_utc)
