"""Tool registry for the agent. Each tool exposes a JSON-Schema declaration (sent
to the model) and a handler that runs against the caller's own workspace. Handlers
return a short text observation. All write-tools are sandboxed to ctx.owner_id."""
import ast
import json
import operator
from dataclasses import dataclass
from datetime import date, timedelta

from sqlmodel import Session, select

from ..models import Contact, Deal, Document, Email, Note, Task, WebPage
from ..util import now_utc


class ToolError(Exception):
    pass


@dataclass
class ToolContext:
    session: Session
    owner_id: int


def _money(cents: int) -> str:
    return f"${cents / 100:,.2f}"


def _today() -> date:
    return now_utc().date()


# --------------------------------------------------------------------------- #
# query_records
# --------------------------------------------------------------------------- #
def _q_deals(ctx: ToolContext, filt: str, limit: int) -> list[dict]:
    stmt = select(Deal).where(Deal.owner_id == ctx.owner_id)
    rows = ctx.session.exec(stmt).all()
    f = filt.lower().strip()
    today = _today()
    if f in ("open", "active"):
        rows = [d for d in rows if d.stage not in ("won", "lost")]
    elif f in ("won", "lost", "prospect", "qualified", "proposal"):
        rows = [d for d in rows if d.stage == f]
    elif f in ("overdue", "stalled"):
        rows = [
            d
            for d in rows
            if d.close_date and d.close_date < today and d.stage not in ("won", "lost")
        ]
    rows.sort(key=lambda d: d.amount_cents, reverse=True)
    out = []
    for d in rows[:limit]:
        contact = ctx.session.get(Contact, d.contact_id) if d.contact_id else None
        out.append(
            {
                "id": d.id,
                "title": d.title,
                "amount": _money(d.amount_cents),
                "stage": d.stage,
                "contact_id": d.contact_id,
                "contact": contact.name if contact else None,
                "close_date": d.close_date.isoformat() if d.close_date else None,
            }
        )
    return out


def _q_contacts(ctx: ToolContext, filt: str, limit: int) -> list[dict]:
    rows = ctx.session.exec(select(Contact).where(Contact.owner_id == ctx.owner_id)).all()
    f = filt.lower().strip()
    if f in ("enterprise", "smb", "startup"):
        rows = [c for c in rows if c.segment == f]
    elif f in ("lead", "active", "churned"):
        rows = [c for c in rows if c.status == f]
    elif f in ("no_activity_30d", "inactive", "stale"):
        cutoff = now_utc() - timedelta(days=30)
        rows = [c for c in rows if (c.last_activity_at is None or c.last_activity_at < cutoff)]
    out = []
    for c in rows[:limit]:
        out.append(
            {
                "id": c.id,
                "name": c.name,
                "company": c.company,
                "segment": c.segment,
                "status": c.status,
                "email": c.email,
                "last_activity": c.last_activity_at.date().isoformat()
                if c.last_activity_at
                else None,
            }
        )
    return out


def _q_tasks(ctx: ToolContext, filt: str, limit: int) -> list[dict]:
    rows = ctx.session.exec(select(Task).where(Task.owner_id == ctx.owner_id)).all()
    f = filt.lower().strip()
    today = _today()
    if f in ("open", "done"):
        rows = [t for t in rows if t.status == f]
    elif f == "overdue":
        rows = [t for t in rows if t.status == "open" and t.due_date and t.due_date < today]
    out = []
    for t in rows[:limit]:
        out.append(
            {
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "created_by": t.created_by,
            }
        )
    return out


def query_records(ctx: ToolContext, args: dict) -> str:
    entity = str(args.get("entity", "")).lower().strip()
    filt = str(args.get("filter", "") or "")
    limit = int(args.get("limit", 10) or 10)
    limit = max(1, min(limit, 25))
    if entity in ("deal", "deals"):
        data = _q_deals(ctx, filt, limit)
    elif entity in ("contact", "contacts"):
        data = _q_contacts(ctx, filt, limit)
    elif entity in ("task", "tasks"):
        data = _q_tasks(ctx, filt, limit)
    else:
        raise ToolError("entity must be one of: contacts, deals, tasks")
    return json.dumps({"count": len(data), "results": data})


# --------------------------------------------------------------------------- #
# search tools
# --------------------------------------------------------------------------- #
def _score(query: str, *fields: str) -> int:
    terms = [w for w in query.lower().split() if len(w) > 2]
    hay = " ".join(fields).lower()
    return sum(hay.count(term) for term in terms)


def _snippet(text: str, n: int = 240) -> str:
    text = " ".join(text.split())
    return text[:n] + ("..." if len(text) > n else "")


def search_knowledge(ctx: ToolContext, args: dict) -> str:
    query = str(args.get("query", "")).strip()
    if not query:
        raise ToolError("query is required")
    limit = max(1, min(int(args.get("limit", 3) or 3), 5))
    docs = ctx.session.exec(
        select(Document).where(Document.owner_id == ctx.owner_id)
    ).all()
    ranked = sorted(
        docs, key=lambda d: _score(query, d.title, d.content), reverse=True
    )
    hits = [d for d in ranked if _score(query, d.title, d.content) > 0][:limit]
    results = [
        {"id": d.id, "title": d.title, "category": d.category, "snippet": _snippet(d.content)}
        for d in hits
    ]
    return json.dumps({"count": len(results), "results": results})


def web_search(ctx: ToolContext, args: dict) -> str:
    query = str(args.get("query", "")).strip()
    if not query:
        raise ToolError("query is required")
    limit = max(1, min(int(args.get("limit", 3) or 3), 5))
    pages = ctx.session.exec(select(WebPage)).all()
    ranked = sorted(
        pages, key=lambda p: _score(query, p.title, p.topic, p.content), reverse=True
    )
    hits = [p for p in ranked if _score(query, p.title, p.topic, p.content) > 0][:limit]
    results = [
        {"title": p.title, "url": p.url, "snippet": _snippet(p.content)} for p in hits
    ]
    return json.dumps({"count": len(results), "results": results})


# --------------------------------------------------------------------------- #
# write tools (sandboxed to owner)
# --------------------------------------------------------------------------- #
def _parse_date(value) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError as exc:
        raise ToolError(f"invalid date '{value}', use YYYY-MM-DD") from exc


def _own_contact(ctx: ToolContext, contact_id) -> Contact | None:
    if contact_id in (None, "", 0):
        return None
    contact = ctx.session.get(Contact, int(contact_id))
    if not contact or contact.owner_id != ctx.owner_id:
        raise ToolError(f"contact {contact_id} not found in your workspace")
    return contact


def create_task(ctx: ToolContext, args: dict) -> str:
    title = str(args.get("title", "")).strip()
    if not title:
        raise ToolError("title is required")
    contact = _own_contact(ctx, args.get("contact_id"))
    task = Task(
        owner_id=ctx.owner_id,
        title=title,
        due_date=_parse_date(args.get("due_date")),
        contact_id=contact.id if contact else None,
        created_by="agent",
    )
    ctx.session.add(task)
    ctx.session.commit()
    ctx.session.refresh(task)
    return json.dumps(
        {"created": "task", "id": task.id, "title": task.title,
         "due_date": task.due_date.isoformat() if task.due_date else None}
    )


def update_deal(ctx: ToolContext, args: dict) -> str:
    deal_id = args.get("deal_id")
    if deal_id in (None, ""):
        raise ToolError("deal_id is required")
    deal = ctx.session.get(Deal, int(deal_id))
    if not deal or deal.owner_id != ctx.owner_id:
        raise ToolError(f"deal {deal_id} not found in your workspace")
    stage = args.get("stage")
    if stage:
        if stage not in ("prospect", "qualified", "proposal", "won", "lost"):
            raise ToolError("stage must be prospect, qualified, proposal, won, or lost")
        deal.stage = stage
    if args.get("amount_cents") not in (None, ""):
        deal.amount_cents = max(0, int(args["amount_cents"]))
    deal.updated_at = now_utc()
    ctx.session.add(deal)
    ctx.session.commit()
    ctx.session.refresh(deal)
    return json.dumps(
        {"updated": "deal", "id": deal.id, "stage": deal.stage, "amount": _money(deal.amount_cents)}
    )


def add_note(ctx: ToolContext, args: dict) -> str:
    body = str(args.get("body", "")).strip()
    if not body:
        raise ToolError("body is required")
    contact = _own_contact(ctx, args.get("contact_id"))
    note = Note(
        owner_id=ctx.owner_id,
        contact_id=contact.id if contact else None,
        body=body,
        created_by="agent",
    )
    ctx.session.add(note)
    ctx.session.commit()
    ctx.session.refresh(note)
    return json.dumps({"created": "note", "id": note.id, "contact": contact.name if contact else None})


def draft_email(ctx: ToolContext, args: dict) -> str:
    subject = str(args.get("subject", "")).strip()
    body = str(args.get("body", "")).strip()
    if not subject or not body:
        raise ToolError("subject and body are required")
    contact = _own_contact(ctx, args.get("contact_id"))
    to_email = str(args.get("to_email", "")).strip() or (contact.email if contact else "")
    email = Email(
        owner_id=ctx.owner_id,
        contact_id=contact.id if contact else None,
        to_email=to_email,
        subject=subject,
        body=body,
        status="draft",
        created_by="agent",
    )
    ctx.session.add(email)
    ctx.session.commit()
    ctx.session.refresh(email)
    return json.dumps(
        {"created": "email_draft", "id": email.id, "to": to_email, "subject": subject}
    )


# --------------------------------------------------------------------------- #
# utility tools
# --------------------------------------------------------------------------- #
_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _safe_eval(node):
    if isinstance(node, ast.Expression):
        return _safe_eval(node.body)
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ToolError("only numbers are allowed")
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_safe_eval(node.operand))
    raise ToolError("unsupported expression")


def calculate(ctx: ToolContext, args: dict) -> str:
    expr = str(args.get("expression", "")).strip()
    if not expr:
        raise ToolError("expression is required")
    try:
        value = _safe_eval(ast.parse(expr, mode="eval"))
    except ToolError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise ToolError(f"could not evaluate '{expr}'") from exc
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return json.dumps({"expression": expr, "result": value})


def summarize(ctx: ToolContext, args: dict) -> str:
    text = str(args.get("text", "")).strip()
    if not text:
        raise ToolError("text is required")
    max_sentences = max(1, min(int(args.get("max_sentences", 3) or 3), 6))
    parts, buf = [], ""
    for ch in text:
        buf += ch
        if ch in ".!?" and len(buf.strip()) > 0:
            parts.append(buf.strip())
            buf = ""
    if buf.strip():
        parts.append(buf.strip())
    summary = " ".join(parts[:max_sentences])
    return json.dumps({"summary": summary, "sentence_count": min(len(parts), max_sentences)})


# --------------------------------------------------------------------------- #
# registry
# --------------------------------------------------------------------------- #
def _obj(props: dict, required: list[str] | None = None) -> dict:
    schema = {"type": "object", "properties": props}
    if required:
        schema["required"] = required
    return schema


TOOLS: dict[str, dict] = {
    "query_records": {
        "description": "Query the workspace. entity is contacts, deals, or tasks. "
        "filter narrows results (deals: open/won/lost/overdue/prospect/qualified/proposal; "
        "contacts: enterprise/smb/startup/lead/active/churned/no_activity_30d; "
        "tasks: open/done/overdue). Results are sorted by amount for deals.",
        "parameters": _obj(
            {
                "entity": {"type": "string", "description": "contacts | deals | tasks"},
                "filter": {"type": "string", "description": "optional filter keyword"},
                "limit": {"type": "integer", "description": "max rows (default 10)"},
            },
            ["entity"],
        ),
        "handler": query_records,
    },
    "search_knowledge": {
        "description": "Search the workspace knowledge base (policies, playbooks, product docs) "
        "for relevant passages. Returns titles and snippets.",
        "parameters": _obj(
            {
                "query": {"type": "string", "description": "what to look for"},
                "limit": {"type": "integer", "description": "max results (default 3)"},
            },
            ["query"],
        ),
        "handler": search_knowledge,
    },
    "web_search": {
        "description": "Search the curated web index for external references. "
        "Returns titles, urls, and snippets.",
        "parameters": _obj(
            {
                "query": {"type": "string", "description": "search query"},
                "limit": {"type": "integer", "description": "max results (default 3)"},
            },
            ["query"],
        ),
        "handler": web_search,
    },
    "create_task": {
        "description": "Create a follow-up task in the workspace. Optionally link a contact_id "
        "and set a due_date (YYYY-MM-DD).",
        "parameters": _obj(
            {
                "title": {"type": "string"},
                "due_date": {"type": "string", "description": "YYYY-MM-DD"},
                "contact_id": {"type": "integer"},
            },
            ["title"],
        ),
        "handler": create_task,
    },
    "update_deal": {
        "description": "Update a deal you own: move its stage or change amount_cents.",
        "parameters": _obj(
            {
                "deal_id": {"type": "integer"},
                "stage": {
                    "type": "string",
                    "description": "prospect | qualified | proposal | won | lost",
                },
                "amount_cents": {"type": "integer"},
            },
            ["deal_id"],
        ),
        "handler": update_deal,
    },
    "add_note": {
        "description": "Add a note to the workspace, optionally attached to a contact_id.",
        "parameters": _obj(
            {"body": {"type": "string"}, "contact_id": {"type": "integer"}},
            ["body"],
        ),
        "handler": add_note,
    },
    "draft_email": {
        "description": "Draft an email into the outbox (nothing is actually sent). "
        "Provide subject and body; optionally contact_id or to_email.",
        "parameters": _obj(
            {
                "subject": {"type": "string"},
                "body": {"type": "string"},
                "contact_id": {"type": "integer"},
                "to_email": {"type": "string"},
            },
            ["subject", "body"],
        ),
        "handler": draft_email,
    },
    "calculate": {
        "description": "Evaluate an arithmetic expression exactly (server-side). "
        "Use this for any math instead of computing it yourself.",
        "parameters": _obj(
            {"expression": {"type": "string", "description": "e.g. (1200 + 800) * 0.9"}},
            ["expression"],
        ),
        "handler": calculate,
    },
    "summarize": {
        "description": "Condense a block of text to its first key sentences.",
        "parameters": _obj(
            {
                "text": {"type": "string"},
                "max_sentences": {"type": "integer", "description": "default 3"},
            },
            ["text"],
        ),
        "handler": summarize,
    },
    "finish": {
        "description": "End the run and return the final answer to the user. "
        "Call this once the goal is complete.",
        "parameters": _obj(
            {"answer": {"type": "string", "description": "the final answer for the user"}},
            ["answer"],
        ),
        "handler": None,  # handled by the loop
    },
}


def tool_schemas() -> list[dict]:
    return [
        {"name": name, "description": spec["description"], "parameters": spec["parameters"]}
        for name, spec in TOOLS.items()
    ]


def execute_tool(ctx: ToolContext, name: str, args: dict) -> tuple[str, str]:
    spec = TOOLS.get(name)
    if not spec or spec.get("handler") is None:
        return (f"Unknown tool '{name}'.", "error")
    try:
        return (spec["handler"](ctx, args or {}), "ok")
    except ToolError as exc:
        return (json.dumps({"error": str(exc)}), "error")
    except Exception as exc:  # noqa: BLE001
        return (json.dumps({"error": f"tool failed: {exc}"}), "error")
