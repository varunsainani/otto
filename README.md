# Otto — Autonomous Work Agent

Otto is an AI agent that runs multi-step work for you by calling tools. Give it a
goal in plain language; it plans, executes a sequence of tool calls against a real
seeded workspace (a mini CRM/ops), and streams its reasoning, each tool call, and
each observation into a live run timeline, then returns a final answer.

Every tool has a visible effect on real data (records queried and updated, emails
drafted to an outbox, notes added, a knowledge base searched), so a run is
transparent and reproducible rather than a single black-box answer.

## Highlights

- **Transparent ReAct agent** — one tool per step, with the model's reasoning, the
  exact tool call, and the observation persisted and streamed to the UI.
- **Real toolset** over a sandboxed workspace: `query_records`, `search_knowledge`,
  `web_search`, `create_task`, `update_deal`, `add_note`, `draft_email`,
  `calculate`, `summarize`, `finish`.
- **Grounded and safe** — the agent only acts on data the tools return, arithmetic
  runs server-side (never trust the model for math), and all write-tools are
  sandboxed to the caller's own workspace.
- **Guardrails** — per-run step cap, per-user daily run cap, provider retry with
  backoff, and a client stream that retries transient blips and can resume.
- **Full EN / ES / PT** across the UI and backend messages, light/dark, responsive.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind v4 + next-intl.
- **Backend:** Python FastAPI + SQLModel + Postgres (Neon) + JWT auth.
- **LLM:** an `LLMProvider` interface — Groq active by default (its free tier suits
  a multi-call agent), Gemini and a deterministic mock switchable.
- **Deploy:** all-Vercel (Next frontend + FastAPI serverless) with a same-origin
  `/api` proxy so the backend URL stays hidden.

## Local development

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set DATABASE_URL, GROQ_API_KEY, JWT_SECRET
python -m app.seed            # create schema + seed demo data
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # proxies /api to http://localhost:8000
```

Open http://localhost:3000 and use the one-click demo login.

## Demo accounts

- `demo@otto.app` / `demo1234` — member with a seeded sales workspace
- `admin@otto.app` / `demo1234` — admin (usage overview across accounts)
