from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..db import get_session
from ..deps import require_admin
from ..models import AgentRun, AgentStep, Email, Task, User
from ..schemas.admin import AdminOverview, AdminRunRow

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/overview", response_model=AdminOverview)
def overview(session: Session = Depends(get_session)):
    users = session.exec(select(User)).all()
    runs = session.exec(select(AgentRun)).all()
    steps = session.exec(select(AgentStep)).all()
    agent_tasks = session.exec(select(Task).where(Task.created_by == "agent")).all()
    emails = session.exec(select(Email)).all()
    return AdminOverview(
        users=len(users),
        runs_total=len(runs),
        runs_succeeded=len([r for r in runs if r.status == "succeeded"]),
        runs_failed=len([r for r in runs if r.status == "failed"]),
        runs_running=len([r for r in runs if r.status == "running"]),
        steps_total=len(steps),
        tasks_by_agent=len(agent_tasks),
        emails_drafted=len(emails),
    )


@router.get("/runs", response_model=list[AdminRunRow])
def recent_runs(session: Session = Depends(get_session)):
    runs = session.exec(
        select(AgentRun).order_by(AgentRun.created_at.desc()).limit(50)
    ).all()
    users = {u.id: u for u in session.exec(select(User)).all()}
    rows: list[AdminRunRow] = []
    for r in runs:
        u = users.get(r.owner_id)
        rows.append(
            AdminRunRow(
                id=r.id,
                user_name=u.name if u else "unknown",
                user_email=u.email if u else "",
                goal=r.goal,
                status=r.status,
                steps_used=r.steps_used,
                created_at=r.created_at,
            )
        )
    return rows
