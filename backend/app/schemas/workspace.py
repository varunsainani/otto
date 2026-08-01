from datetime import date, datetime

from pydantic import BaseModel, Field


class ContactOut(BaseModel):
    id: int
    name: str
    email: str
    company: str
    title: str
    status: str
    segment: str
    last_activity_at: datetime | None = None


class DealOut(BaseModel):
    id: int
    title: str
    amount_cents: int
    stage: str
    contact_id: int | None = None
    contact_name: str | None = None
    close_date: date | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    status: str
    due_date: date | None = None
    created_by: str
    contact_id: int | None = None
    contact_name: str | None = None
    created_at: datetime


class NoteOut(BaseModel):
    id: int
    body: str
    created_by: str
    contact_id: int | None = None
    contact_name: str | None = None
    created_at: datetime


class EmailOut(BaseModel):
    id: int
    to_email: str
    subject: str
    body: str
    status: str
    created_by: str
    contact_id: int | None = None
    contact_name: str | None = None
    created_at: datetime


class DocumentOut(BaseModel):
    id: int
    title: str
    category: str


class DocumentDetailOut(DocumentOut):
    content: str


class WorkspaceSummary(BaseModel):
    contacts: int
    deals_open: int
    pipeline_cents: int
    tasks_open: int
    emails_draft: int
    documents: int


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    due_date: date | None = None
    contact_id: int | None = None


class TaskUpdate(BaseModel):
    status: str | None = None
    title: str | None = None


class DealUpdate(BaseModel):
    stage: str | None = None
    amount_cents: int | None = None


class EmailUpdate(BaseModel):
    status: str | None = None
