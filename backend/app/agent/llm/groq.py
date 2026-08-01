import json
import time

import httpx

from .base import LLMProvider, LLMResult, ToolCall

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
RETRY_STATUSES = {429, 500, 502, 503}
BACKOFFS = (2.5, 6.0)


class GroqProvider(LLMProvider):
    """OpenAI-compatible chat completions with tool calling."""

    name = "groq"

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def generate(self, system: str, transcript: list[dict], tools: list[dict]) -> LLMResult:
        messages: list[dict] = [{"role": "system", "content": system}]
        for m in transcript:
            role = m["role"]
            if role == "user":
                messages.append({"role": "user", "content": m["text"]})
            elif role == "assistant":
                tc = m.get("tool_call")
                if tc:
                    messages.append(
                        {
                            "role": "assistant",
                            "content": m.get("text") or "",
                            "tool_calls": [
                                {
                                    "id": tc["id"],
                                    "type": "function",
                                    "function": {
                                        "name": tc["name"],
                                        "arguments": json.dumps(tc["args"] or {}),
                                    },
                                }
                            ],
                        }
                    )
                else:
                    messages.append({"role": "assistant", "content": m.get("text") or ""})
            elif role == "tool":
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": m["tool_call_id"],
                        "content": m["text"],
                    }
                )

        body = {
            "model": self.model,
            "messages": messages,
            "tools": [
                {"type": "function", "function": {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": t.get("parameters") or {"type": "object", "properties": {}},
                }}
                for t in tools
            ],
            "tool_choice": "auto",
            "temperature": 0.2,
        }
        data = None
        for attempt in range(len(BACKOFFS) + 1):
            try:
                with httpx.Client(timeout=45) as client:
                    resp = client.post(
                        GROQ_URL,
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json=body,
                    )
                resp.raise_for_status()
                data = resp.json()
                break
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code in RETRY_STATUSES and attempt < len(BACKOFFS):
                    time.sleep(BACKOFFS[attempt])
                    continue
                raise
            except httpx.HTTPError:
                if attempt < len(BACKOFFS):
                    time.sleep(BACKOFFS[attempt])
                    continue
                raise
        msg = (data.get("choices") or [{}])[0].get("message") or {}
        tool_calls = msg.get("tool_calls") or []
        if tool_calls:
            first = tool_calls[0]
            fn = first.get("function") or {}
            try:
                args = json.loads(fn.get("arguments") or "{}")
            except json.JSONDecodeError:
                args = {}
            return LLMResult(
                text=msg.get("content") or None,
                tool_call=ToolCall(id=first.get("id", "call"), name=fn.get("name", ""), args=args),
            )
        return LLMResult(text=msg.get("content") or None)
