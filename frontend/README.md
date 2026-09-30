# Otto frontend

Next.js (App Router) client for Otto. It renders the landing page, auth, the workspace (contacts, deals, tasks, notes, emails, documents), and the live run timeline that streams the agent's reasoning, tool calls, and observations. It proxies `/api/*` to the FastAPI backend so the browser only talks to the frontend origin.

See the [project README](../README.md) for the full overview, and [docs/API.md](../docs/API.md) for the API.

## Develop

```bash
cp .env.example .env.local   # set API_PROXY_TARGET to the backend URL
npm install
npm run dev                  # http://localhost:3000
```
