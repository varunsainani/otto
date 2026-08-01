# Otto — Autonomous Work Agent (build plan)

Otto is an AI agent that runs multi-step work for you by calling tools. Give it a
goal in plain language; it plans, executes a sequence of tool calls against a real
seeded workspace (a mini CRM/ops), and streams its reasoning, each tool call, and
each observation into a live run timeline, then returns a final answer.

## Why this demos well
Every tool has a visible effect on real data (records queried/created/updated,
emails drafted to an outbox, notes added, a knowledge base searched). Nothing is
faked, and the run is deterministic and self-contained (no flaky external calls).

## Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind + next-intl (EN/ES/PT),
  light/dark, responsive.
- Backend: Python FastAPI (primary) + SQLModel + Postgres (Neon) + JWT auth
  (python-jose) + bcrypt (passlib).
- LLM: `LLMProvider` interface; Gemini active (free), Groq/Claude switchable.
- Deploy: all-Vercel (Next frontend + FastAPI serverless via @vercel/python) + own
  Neon DB; same-origin `/api` proxy so the backend URL stays hidden.

## The agent loop
ReAct-style loop: the model (Gemini function-calling) proposes a tool call, the
backend executes it against the workspace DB, the observation is fed back, repeat
until the model calls `finish()` or hits a step cap. Every step is persisted to
`agent_steps` and streamed to the UI.

Guardrails:
- Max-steps cap per run.
- Per-user/day run cap (protect the free Gemini quota), checked before the LLM call.
- Tool allowlist; all write-tools sandboxed to the caller's own workspace.
- Never trust the model for arithmetic (a real `calculate` tool computes server-side).
- Structured tool-args validation + retry once + safe error observation so a bad
  model response never crashes a run.

## Toolset
`search_knowledge`, `query_records`, `create_task`, `update_deal`, `add_note`,
`draft_email` (to a simulated outbox), `calculate`, `summarize`,
`web_search` (curated seeded index, reproducible), `finish`.

## Data model
- `users` (roles: member, admin), sessions via JWT.
- Workspace: `contacts`, `deals`, `tasks`, `notes`, `documents` (knowledge base),
  `emails` (outbox), `web_pages` (curated search index).
- Agent: `agent_runs` (goal, status, final answer, token/step usage),
  `agent_steps` (index, thought, tool, args, observation, latency).

## Screens
Marketing landing, one-click demo login, run composer (goal or example prompt),
live run timeline, workspace views (Contacts / Deals / Tasks / Outbox / Knowledge),
run history, settings, light admin (runs + usage).

## Non-negotiables (playbook)
Full EN/ES/PT (UI + backend messages), genuinely full-stack (live data, real demo
login, CRUD persists, no dead buttons), rich seed data, light/dark + responsive,
env vars persisted on Vercel, same-origin proxy, final multi-perspective audit.

## Design
Graphite mission-control, dark-first, one electric accent (cyan), monospace run
trace (tool calls/observations read like a live console), clean sans elsewhere.
