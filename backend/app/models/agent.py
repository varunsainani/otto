from datetime import datetime

from sqlmodel import Field, SQLModel

from ..util import now_utc


class AgentRun(SQLModel, table=True):
    __tablename__ = "agent_runs"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True, foreign_key="users.id")
    goal: str
    status: str = Field(default="running")  # running | succeeded | failed | stopped
    final_answer: str | None = None
    steps_used: int = 0
    error: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    finished_at: datetime | None = None


class AgentStep(SQLModel, table=True):
    __tablename__ = "agent_steps"

    id: int | None = Field(default=None, primary_key=True)
    run_id: int = Field(index=True, foreign_key="agent_runs.id")
    idx: int = 0
    thought: str | None = None
    tool: str | None = None
    args_json: str = "{}"
    observation: str = ""
    status: str = Field(default="ok")  # ok | error
    latency_ms: int = 0
    # Gemini 2.5 thinking models return a thought_signature on function-call parts
    # that must be echoed back on the next turn. Persisted so the stateless
    # serverless advance can reconstruct a valid transcript.
    signature: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
