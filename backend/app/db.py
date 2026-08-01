from collections.abc import Generator

from sqlalchemy.pool import NullPool
from sqlmodel import Session, SQLModel, create_engine

from .config import settings


def _normalize(url: str) -> str:
    """Neon hands out postgres:// URLs; SQLAlchemy wants postgresql://."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


_url = _normalize(settings.database_url) or "sqlite://"

# NullPool: on Vercel serverless every invocation is a short-lived container, so a
# persistent SQLAlchemy pool just accumulates dead sockets. Neon's own pooler
# handles connection reuse. pool_pre_ping guards against stale handles either way.
engine = create_engine(
    _url,
    echo=False,
    pool_pre_ping=True,
    poolclass=NullPool,
    connect_args={"connect_timeout": 10} if _url.startswith("postgresql") else {},
)


def init_db() -> None:
    # Import models so SQLModel.metadata is populated before create_all.
    from . import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
