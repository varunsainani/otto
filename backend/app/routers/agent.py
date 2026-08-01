import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..agent.loop import advance_run
from ..config import settings
from ..db import get_session
from ..deps import get_current_user, get_locale
from ..i18n import t
from ..models import AgentRun, AgentStep, User
from ..schemas.agent import RunCreate, RunOut, RunSummary, StepOut
from ..util import now_utc

router = APIRouter(prefix="/api/runs", tags=["agent"])


def _step_out(step: AgentStep) -> StepOut:
    try:
        args = json.loads(step.args_json or "{}")
    except json.JSONDecodeError:
        args = {}
    return StepOut(
        id=step.id,
        idx=step.idx,
        thought=step.thought,
        tool=step.tool,
        args=args,
        observation=step.observation,
        status=step.status,
        latency_ms=step.latency_ms,
        created_at=step.created_at,
    )


def _run_out(session: Session, run: AgentRun) -> RunOut:
    steps = session.exec(
        select(AgentStep).where(AgentStep.run_id == run.id).order_by(AgentStep.idx)
    ).all()
    return RunOut(
        id=run.id,
        goal=run.goal,
        status=run.status,
        final_answer=run.final_answer,
        steps_used=run.steps_used,
        error=run.error,
        created_at=run.created_at,
        finished_at=run.finished_at,
        steps=[_step_out(s) for s in steps],
    )


def _get_owned_run(session: Session, run_id: int, user: User, locale: str) -> AgentRun:
    run = session.get(AgentRun, run_id)
    if not run or run.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, t("run_not_found", locale))
    return run


@router.post("", response_model=RunOut)
def create_run(
    body: RunCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    goal = body.goal.strip()
    if not goal:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, t("goal_required", locale))

    day_start = now_utc().replace(hour=0, minute=0, second=0, microsecond=0)
    todays = session.exec(
        select(AgentRun).where(
            AgentRun.owner_id == user.id, AgentRun.created_at >= day_start
        )
    ).all()
    if len(todays) >= settings.daily_run_limit:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, t("daily_limit_reached", locale))

    run = AgentRun(owner_id=user.id, goal=goal, status="running")
    session.add(run)
    session.commit()
    session.refresh(run)
    return _run_out(session, run)


@router.post("/{run_id}/advance", response_model=RunOut)
def advance(
    run_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    run = _get_owned_run(session, run_id, user, locale)
    advance_run(session, run, locale=locale)
    session.refresh(run)
    return _run_out(session, run)


@router.post("/{run_id}/stop", response_model=RunOut)
def stop(
    run_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    run = _get_owned_run(session, run_id, user, locale)
    if run.status == "running":
        run.status = "stopped"
        run.finished_at = now_utc()
        session.add(run)
        session.commit()
        session.refresh(run)
    return _run_out(session, run)


@router.get("", response_model=list[RunSummary])
def list_runs(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    runs = session.exec(
        select(AgentRun)
        .where(AgentRun.owner_id == user.id)
        .order_by(AgentRun.created_at.desc())
        .limit(50)
    ).all()
    return [
        RunSummary(
            id=r.id,
            goal=r.goal,
            status=r.status,
            steps_used=r.steps_used,
            created_at=r.created_at,
            finished_at=r.finished_at,
        )
        for r in runs
    ]


@router.get("/{run_id}", response_model=RunOut)
def get_run(
    run_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    locale: str = Depends(get_locale),
):
    run = _get_owned_run(session, run_id, user, locale)
    return _run_out(session, run)
