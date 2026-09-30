# Otto API reference

Base path: `/api` (the Next.js frontend proxies `/api/*` to the FastAPI backend). All routes except login and register require an `Authorization: Bearer <access_token>` header. Bodies are JSON.

## Auth `/api/auth`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/login` | no | `{ email, password }`, returns the user and an `access_token`. |
| POST | `/register` | no | `{ name, email, password }`. |
| GET | `/me` | yes | Current user. |
| PATCH | `/me` | yes | Update profile (name, locale, theme). |

## Agent runs `/api/runs`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `` | yes | Start a run. Body: `{ goal }`. Returns the run (status `running`). |
| POST | `/{id}/advance` | yes | Execute the next step (one tool call). Returns the run with its steps. Poll until status is `succeeded`, `failed`, or `stopped`. |
| POST | `/{id}/stop` | yes | Stop a running agent. |
| GET | `` | yes | List the user's runs. |
| GET | `/{id}` | yes | A single run with its full step timeline. |

Each step records the model's `thought`, the `tool` and its arguments, the `observation`, `status`, and `latency_ms`. Tools: `query_records`, `search_knowledge`, `web_search`, `create_task`, `update_deal`, `add_note`, `draft_email`, `calculate`, `summarize`, `finish`.

## Workspace `/api`

| Method | Path | Purpose |
|---|---|---|
| GET | `/workspace/summary` | Counts and highlights for the workspace. |
| GET | `/contacts` | List contacts. |
| GET | `/deals` | List deals. |
| PATCH | `/deals/{id}` | Update a deal. |
| GET / POST | `/tasks` | List or create tasks. |
| PATCH | `/tasks/{id}` | Update a task. |
| GET | `/notes` | List notes. |
| GET | `/emails` | List drafted emails (the outbox). |
| PATCH | `/emails/{id}` | Update an email draft. |
| GET | `/documents` | List knowledge-base documents. |
| GET | `/documents/{id}` | A single document. |

## Admin `/api/admin`

| Method | Path | Purpose |
|---|---|---|
| GET | `/overview` | Platform-wide stats. |
| GET | `/runs` | Recent runs across users. |

## Health

`GET /health` returns a simple OK for uptime checks.
