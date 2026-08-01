from datetime import datetime

from pydantic import BaseModel, Field


class RunCreate(BaseModel):
    goal: str = Field(min_length=1, max_length=2000)


class StepOut(BaseModel):
    id: int
    idx: int
    thought: str | None = None
    tool: str | None = None
    args: dict = {}
    observation: str = ""
    status: str = "ok"
    latency_ms: int = 0
    created_at: datetime


class RunOut(BaseModel):
    id: int
    goal: str
    status: str
    final_answer: str | None = None
    steps_used: int = 0
    error: str | None = None
    created_at: datetime
    finished_at: datetime | None = None
    steps: list[StepOut] = []


class RunSummary(BaseModel):
    id: int
    goal: str
    status: str
    steps_used: int
    created_at: datetime
    finished_at: datetime | None = None
