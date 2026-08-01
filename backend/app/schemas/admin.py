from datetime import datetime

from pydantic import BaseModel


class AdminOverview(BaseModel):
    users: int
    runs_total: int
    runs_succeeded: int
    runs_failed: int
    runs_running: int
    steps_total: int
    tasks_by_agent: int
    emails_drafted: int


class AdminRunRow(BaseModel):
    id: int
    user_name: str
    user_email: str
    goal: str
    status: str
    steps_used: int
    created_at: datetime
