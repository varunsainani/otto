import json
import time

from sqlmodel import Session, select

from ..config import settings
from ..models import AgentRun, AgentStep
from ..util import now_utc
from .llm import LLMProvider, get_provider
from .tools import ToolContext, execute_tool, tool_schemas

_LANG = {"en": "English", "es": "Spanish", "pt": "Portuguese"}

SYSTEM_PROMPT = """You are Otto, an autonomous work assistant embedded in a small sales and operations workspace.

You accomplish the user's goal by calling tools one step at a time. On each turn:
- Briefly state your reasoning for the next action, then call exactly one tool.
- Inspect the tool result before deciding the next step.
- Use `query_records` and `search_knowledge` / `web_search` to gather facts. Never invent contacts, deals, amounts, or ids; only act on data the tools return.
- Use `calculate` for any arithmetic instead of computing it yourself.
- Use `create_task`, `update_deal`, `add_note`, and `draft_email` to make real changes. Reference the exact ids you found.
- When the goal is complete, call `finish` with a clear, concise final answer that summarizes what you did and what you found.

Keep reasoning short and specific. Prefer a few decisive steps over many. Do not repeat a tool call that already succeeded."""


def build_transcript(run: AgentRun, steps: list[AgentStep]) -> list[dict]:
    transcript: list[dict] = [{"role": "user", "text": run.goal}]
    for s in steps:
        if s.tool:
            try:
                args = json.loads(s.args_json or "{}")
            except json.JSONDecodeError:
                args = {}
            call_id = f"call_{s.idx}"
            transcript.append(
                {
                    "role": "assistant",
                    "text": s.thought,
                    "tool_call": {"id": call_id, "name": s.tool, "args": args},
                }
            )
            transcript.append(
                {
                    "role": "tool",
                    "tool_call_id": call_id,
                    "name": s.tool,
                    "text": s.observation,
                }
            )
        elif s.thought:
            transcript.append({"role": "assistant", "text": s.thought})
    return transcript


def _system_for(locale: str) -> str:
    language = _LANG.get(locale, "English")
    return f"{SYSTEM_PROMPT}\n\nWrite your reasoning and the final answer in {language}."


def _finalize(session: Session, run: AgentRun, status: str, error: str | None, idx: int) -> None:
    run.status = status
    run.error = error
    run.finished_at = now_utc()
    run.steps_used = idx
    session.add(run)
    session.commit()


def advance_run(
    session: Session,
    run: AgentRun,
    locale: str = "en",
    provider: LLMProvider | None = None,
) -> AgentStep | None:
    """Execute a single step of the run: one model turn plus, if it calls a tool,
    one tool execution. Persists the step and updates run status. Returns the new
    step, or None if the run is already finished or just terminated."""
    if run.status != "running":
        return None

    steps = session.exec(
        select(AgentStep).where(AgentStep.run_id == run.id).order_by(AgentStep.idx)
    ).all()
    idx = len(steps)
    if idx >= settings.max_agent_steps:
        _finalize(session, run, "failed", "step_limit_reached", idx)
        return None

    provider = provider or get_provider()
    transcript = build_transcript(run, steps)

    started = time.perf_counter()
    try:
        result = provider.generate(_system_for(locale), transcript, tool_schemas())
    except Exception as exc:  # noqa: BLE001
        _finalize(session, run, "failed", f"llm_error: {exc}", idx)
        return None
    latency = int((time.perf_counter() - started) * 1000)

    ctx = ToolContext(session=session, owner_id=run.owner_id)

    if result.tool_call and result.tool_call.name == "finish":
        args = result.tool_call.args or {}
        answer = str(args.get("answer", "")).strip() or (result.text or "Done.")
        step = AgentStep(
            run_id=run.id,
            idx=idx,
            thought=result.text,
            tool="finish",
            args_json=json.dumps(args),
            observation=answer,
            status="ok",
            latency_ms=latency,
        )
        session.add(step)
        run.final_answer = answer
        _finalize(session, run, "succeeded", None, idx + 1)
        session.refresh(step)
        return step

    if result.tool_call:
        tc = result.tool_call
        observation, status = execute_tool(ctx, tc.name, tc.args or {})
        step = AgentStep(
            run_id=run.id,
            idx=idx,
            thought=result.text,
            tool=tc.name,
            args_json=json.dumps(tc.args or {}),
            observation=observation,
            status=status,
            latency_ms=latency,
        )
        session.add(step)
        run.steps_used = idx + 1
        session.add(run)
        session.commit()
        session.refresh(step)
        return step

    # No tool call: treat the text as the final answer.
    answer = (result.text or "").strip() or "Done."
    step = AgentStep(
        run_id=run.id,
        idx=idx,
        thought=None,
        tool=None,
        args_json="{}",
        observation=answer,
        status="ok",
        latency_ms=latency,
    )
    session.add(step)
    run.final_answer = answer
    _finalize(session, run, "succeeded", None, idx + 1)
    session.refresh(step)
    return step
