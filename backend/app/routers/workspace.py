from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..db import get_session
from ..deps import get_current_user, get_locale
from ..i18n import t
from ..models import Contact, Deal, Document, Email, Note, Task, User
from ..schemas.workspace import (
    ContactOut,
    DealOut,
    DealUpdate,
    DocumentDetailOut,
    DocumentOut,
    EmailOut,
    EmailUpdate,
    NoteOut,
    TaskCreate,
    TaskOut,
    TaskUpdate,
    WorkspaceSummary,
)
from ..util import now_utc

router = APIRouter(prefix="/api", tags=["workspace"])


def _contact_map(session: Session, owner_id: int) -> dict[int, str]:
    contacts = session.exec(select(Contact).where(Contact.owner_id == owner_id)).all()
    return {c.id: c.name for c in contacts}


# --------------------------------------------------------------------------- #
# summary
# --------------------------------------------------------------------------- #
@router.get("/workspace/summary", response_model=WorkspaceSummary)
def summary(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    contacts = session.exec(select(Contact).where(Contact.owner_id == user.id)).all()
    deals = session.exec(select(Deal).where(Deal.owner_id == user.id)).all()
    tasks = session.exec(select(Task).where(Task.owner_id == user.id)).all()
    emails = session.exec(select(Email).where(Email.owner_id == user.id)).all()
    docs = session.exec(select(Document).where(Document.owner_id == user.id)).all()
    open_deals = [d for d in deals if d.stage not in ("won", "lost")]
    return WorkspaceSummary(
        contacts=len(contacts),
        deals_open=len(open_deals),
        pipeline_cents=sum(d.amount_cents for d in open_deals),
        tasks_open=len([t for t in tasks if t.status == "open"]),
        emails_draft=len([e for e in emails if e.status == "draft"]),
        documents=len(docs),
    )


# --------------------------------------------------------------------------- #
# contacts
# --------------------------------------------------------------------------- #
@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(Contact).where(Contact.owner_id == user.id).order_by(Contact.name)
    ).all()
    return [ContactOut(**c.model_dump()) for c in rows]


# --------------------------------------------------------------------------- #
# deals
# --------------------------------------------------------------------------- #
@router.get("/deals", response_model=list[DealOut])
def list_deals(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    names = _contact_map(session, user.id)
    rows = session.exec(
        select(Deal).where(Deal.owner_id == user.id).order_by(Deal.amount_cents.desc())
    ).all()
    return [
        DealOut(
            id=d.id,
            title=d.title,
            amount_cents=d.amount_cents,
            stage=d.stage,
            contact_id=d.contact_id,
            contact_name=names.get(d.contact_id),
            close_date=d.close_date,
        )
        for d in rows
    ]


@router.patch("/deals/{deal_id}", response_model=DealOut)
def update_deal(
    deal_id: int,
    body: DealUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    deal = session.get(Deal, deal_id)
    if not deal or deal.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("not_found", locale))
    if body.stage in ("prospect", "qualified", "proposal", "won", "lost"):
        deal.stage = body.stage
    if body.amount_cents is not None and body.amount_cents >= 0:
        deal.amount_cents = body.amount_cents
    deal.updated_at = now_utc()
    session.add(deal)
    session.commit()
    session.refresh(deal)
    names = _contact_map(session, user.id)
    return DealOut(
        id=deal.id,
        title=deal.title,
        amount_cents=deal.amount_cents,
        stage=deal.stage,
        contact_id=deal.contact_id,
        contact_name=names.get(deal.contact_id),
        close_date=deal.close_date,
    )


# --------------------------------------------------------------------------- #
# tasks
# --------------------------------------------------------------------------- #
@router.get("/tasks", response_model=list[TaskOut])
def list_tasks(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    names = _contact_map(session, user.id)
    rows = session.exec(
        select(Task).where(Task.owner_id == user.id).order_by(Task.created_at.desc())
    ).all()
    return [
        TaskOut(
            id=t.id,
            title=t.title,
            status=t.status,
            due_date=t.due_date,
            created_by=t.created_by,
            contact_id=t.contact_id,
            contact_name=names.get(t.contact_id),
            created_at=t.created_at,
        )
        for t in rows
    ]


@router.post("/tasks", response_model=TaskOut)
def create_task(
    body: TaskCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    task = Task(
        owner_id=user.id,
        title=body.title.strip(),
        due_date=body.due_date,
        contact_id=body.contact_id,
        created_by="user",
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    names = _contact_map(session, user.id)
    return TaskOut(
        id=task.id,
        title=task.title,
        status=task.status,
        due_date=task.due_date,
        created_by=task.created_by,
        contact_id=task.contact_id,
        contact_name=names.get(task.contact_id),
        created_at=task.created_at,
    )


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    body: TaskUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    task = session.get(Task, task_id)
    if not task or task.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("not_found", locale))
    if body.status in ("open", "done"):
        task.status = body.status
    if body.title and body.title.strip():
        task.title = body.title.strip()
    session.add(task)
    session.commit()
    session.refresh(task)
    names = _contact_map(session, user.id)
    return TaskOut(
        id=task.id,
        title=task.title,
        status=task.status,
        due_date=task.due_date,
        created_by=task.created_by,
        contact_id=task.contact_id,
        contact_name=names.get(task.contact_id),
        created_at=task.created_at,
    )


# --------------------------------------------------------------------------- #
# notes
# --------------------------------------------------------------------------- #
@router.get("/notes", response_model=list[NoteOut])
def list_notes(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    names = _contact_map(session, user.id)
    rows = session.exec(
        select(Note).where(Note.owner_id == user.id).order_by(Note.created_at.desc())
    ).all()
    return [
        NoteOut(
            id=n.id,
            body=n.body,
            created_by=n.created_by,
            contact_id=n.contact_id,
            contact_name=names.get(n.contact_id),
            created_at=n.created_at,
        )
        for n in rows
    ]


# --------------------------------------------------------------------------- #
# emails (outbox)
# --------------------------------------------------------------------------- #
@router.get("/emails", response_model=list[EmailOut])
def list_emails(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    names = _contact_map(session, user.id)
    rows = session.exec(
        select(Email).where(Email.owner_id == user.id).order_by(Email.created_at.desc())
    ).all()
    return [
        EmailOut(
            id=e.id,
            to_email=e.to_email,
            subject=e.subject,
            body=e.body,
            status=e.status,
            created_by=e.created_by,
            contact_id=e.contact_id,
            contact_name=names.get(e.contact_id),
            created_at=e.created_at,
        )
        for e in rows
    ]


@router.patch("/emails/{email_id}", response_model=EmailOut)
def update_email(
    email_id: int,
    body: EmailUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    email = session.get(Email, email_id)
    if not email or email.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("not_found", locale))
    if body.status in ("draft", "sent"):
        email.status = body.status
    session.add(email)
    session.commit()
    session.refresh(email)
    names = _contact_map(session, user.id)
    return EmailOut(
        id=email.id,
        to_email=email.to_email,
        subject=email.subject,
        body=email.body,
        status=email.status,
        created_by=email.created_by,
        contact_id=email.contact_id,
        contact_name=names.get(email.contact_id),
        created_at=email.created_at,
    )


# --------------------------------------------------------------------------- #
# documents (knowledge base)
# --------------------------------------------------------------------------- #
@router.get("/documents", response_model=list[DocumentOut])
def list_documents(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(Document).where(Document.owner_id == user.id).order_by(Document.title)
    ).all()
    return [DocumentOut(id=d.id, title=d.title, category=d.category) for d in rows]


@router.get("/documents/{doc_id}", response_model=DocumentDetailOut)
def get_document(
    doc_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    doc = session.get(Document, doc_id)
    if not doc or doc.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("not_found", locale))
    return DocumentDetailOut(id=doc.id, title=doc.title, category=doc.category, content=doc.content)
