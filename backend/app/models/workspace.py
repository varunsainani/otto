from datetime import date, datetime

from sqlmodel import Field, SQLModel

from ..util import now_utc


class Contact(SQLModel, table=True):
    __tablename__ = "contacts"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True, foreign_key="users.id")
    name: str
    email: str = ""
    company: str = ""
    title: str = ""
    status: str = Field(default="lead")  # lead | active | churned
    segment: str = Field(default="smb")  # smb | enterprise | startup
    last_activity_at: datetime | None = None
    created_at: datetime = Field(default_factory=now_utc)


class Deal(SQLModel, table=True):
    __tablename__ = "deals"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True, foreign_key="users.id")
    contact_id: int | None = Field(default=None, foreign_key="contacts.id")
    title: str
    amount_cents: int = 0
    stage: str = Field(default="prospect")  # prospect | qualified | proposal | won | lost
    close_date: date | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True, foreign_key="users.id")
    contact_id: int | None = Field(default=None, foreign_key="contacts.id")
    title: str
    due_date: date | None = None
    status: str = Field(default="open")  # open | done
    created_by: str = Field(default="user")  # user | agent
    created_at: datetime = Field(default_factory=now_utc)


class Note(SQLModel, table=True):
    __tablename__ = "notes"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True, foreign_key="users.id")
    contact_id: int | None = Field(default=None, foreign_key="contacts.id")
    body: str
    created_by: str = Field(default="user")  # user | agent
    created_at: datetime = Field(default_factory=now_utc)


class Document(SQLModel, table=True):
    """Knowledge base entry searched by the agent's search_knowledge tool."""

    __tablename__ = "documents"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True, foreign_key="users.id")
    title: str
    category: str = ""
    content: str = ""
    created_at: datetime = Field(default_factory=now_utc)


class Email(SQLModel, table=True):
    """Simulated outbox. draft_email writes here; nothing actually sends."""

    __tablename__ = "emails"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True, foreign_key="users.id")
    contact_id: int | None = Field(default=None, foreign_key="contacts.id")
    to_email: str = ""
    subject: str
    body: str
    status: str = Field(default="draft")  # draft | sent
    created_by: str = Field(default="agent")  # user | agent
    created_at: datetime = Field(default_factory=now_utc)


class WebPage(SQLModel, table=True):
    """Curated, global search index backing the web_search tool so demo runs are
    reproducible (no live network calls)."""

    __tablename__ = "web_pages"

    id: int | None = Field(default=None, primary_key=True)
    url: str
    title: str
    topic: str = ""
    content: str = ""
