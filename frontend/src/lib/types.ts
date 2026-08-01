export type Role = "member" | "admin";
export type RunStatus = "running" | "succeeded" | "failed" | "stopped";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  locale: string;
  theme: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface StepOut {
  id: number;
  idx: number;
  thought: string | null;
  tool: string | null;
  args: Record<string, unknown>;
  observation: string;
  status: "ok" | "error";
  latency_ms: number;
  created_at: string;
}

export interface RunOut {
  id: number;
  goal: string;
  status: RunStatus;
  final_answer: string | null;
  steps_used: number;
  error: string | null;
  created_at: string;
  finished_at: string | null;
  steps: StepOut[];
}

export interface RunSummary {
  id: number;
  goal: string;
  status: RunStatus;
  steps_used: number;
  created_at: string;
  finished_at: string | null;
}

export interface WorkspaceSummary {
  contacts: number;
  deals_open: number;
  pipeline_cents: number;
  tasks_open: number;
  emails_draft: number;
  documents: number;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  company: string;
  title: string;
  status: string;
  segment: string;
  last_activity_at: string | null;
}

export interface Deal {
  id: number;
  title: string;
  amount_cents: number;
  stage: string;
  contact_id: number | null;
  contact_name: string | null;
  close_date: string | null;
}

export interface Task {
  id: number;
  title: string;
  status: string;
  due_date: string | null;
  created_by: string;
  contact_id: number | null;
  contact_name: string | null;
  created_at: string;
}

export interface Note {
  id: number;
  body: string;
  created_by: string;
  contact_id: number | null;
  contact_name: string | null;
  created_at: string;
}

export interface Email {
  id: number;
  to_email: string;
  subject: string;
  body: string;
  status: string;
  created_by: string;
  contact_id: number | null;
  contact_name: string | null;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  title: string;
  category: string;
}

export interface DocumentDetail extends DocumentItem {
  content: string;
}

export interface AdminOverview {
  users: number;
  runs_total: number;
  runs_succeeded: number;
  runs_failed: number;
  runs_running: number;
  steps_total: number;
  tasks_by_agent: number;
  emails_drafted: number;
}

export interface AdminRunRow {
  id: number;
  user_name: string;
  user_email: string;
  goal: string;
  status: string;
  steps_used: number;
  created_at: string;
}
