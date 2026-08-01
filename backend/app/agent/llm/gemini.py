import time

import httpx

from .base import LLMProvider, LLMResult, ToolCall

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Free-tier RPM limits mean a burst of steps can transiently 429. Back off and retry
# rather than failing the whole run.
RETRY_STATUSES = {429, 500, 502, 503}
BACKOFFS = (2.5, 6.0)


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def generate(self, system: str, transcript: list[dict], tools: list[dict]) -> LLMResult:
        body = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": self._to_contents(transcript),
            "tools": [{"function_declarations": [self._decl(t) for t in tools]}],
            "tool_config": {"function_calling_config": {"mode": "AUTO"}},
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024},
        }
        url = GEMINI_URL.format(model=self.model)
        for attempt in range(len(BACKOFFS) + 1):
            try:
                with httpx.Client(timeout=45) as client:
                    resp = client.post(url, params={"key": self.api_key}, json=body)
                resp.raise_for_status()
                return self._parse(resp.json())
            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code
                if status in RETRY_STATUSES and attempt < len(BACKOFFS):
                    time.sleep(BACKOFFS[attempt])
                    continue
                raise
            except httpx.HTTPError:
                if attempt < len(BACKOFFS):
                    time.sleep(BACKOFFS[attempt])
                    continue
                raise
        raise RuntimeError("unreachable")

    @staticmethod
    def _decl(tool: dict) -> dict:
        params = tool.get("parameters") or {"type": "object", "properties": {}}
        return {
            "name": tool["name"],
            "description": tool.get("description", ""),
            "parameters": params,
        }

    @staticmethod
    def _to_contents(transcript: list[dict]) -> list[dict]:
        contents: list[dict] = []
        for m in transcript:
            role = m["role"]
            if role == "user":
                contents.append({"role": "user", "parts": [{"text": m["text"]}]})
            elif role == "assistant":
                parts: list[dict] = []
                if m.get("text"):
                    parts.append({"text": m["text"]})
                tc = m.get("tool_call")
                if tc:
                    call_part: dict = {
                        "functionCall": {"name": tc["name"], "args": tc["args"] or {}}
                    }
                    if tc.get("signature"):
                        # Echo the thought signature so 2.5 models accept the turn.
                        call_part["thoughtSignature"] = tc["signature"]
                    parts.append(call_part)
                if not parts:
                    parts = [{"text": ""}]
                contents.append({"role": "model", "parts": parts})
            elif role == "tool":
                contents.append(
                    {
                        "role": "user",
                        "parts": [
                            {
                                "functionResponse": {
                                    "name": m["name"],
                                    "response": {"result": m["text"]},
                                }
                            }
                        ],
                    }
                )
        return contents

    @staticmethod
    def _parse(data: dict) -> LLMResult:
        candidates = data.get("candidates") or []
        if not candidates:
            return LLMResult(text="")
        parts = ((candidates[0].get("content") or {}).get("parts")) or []
        text_bits: list[str] = []
        call: ToolCall | None = None
        for p in parts:
            if isinstance(p.get("text"), str):
                text_bits.append(p["text"])
            fc = p.get("functionCall")
            if fc and call is None:
                call = ToolCall(
                    id="call",
                    name=fc.get("name", ""),
                    args=fc.get("args") or {},
                    signature=p.get("thoughtSignature"),
                )
        text = "\n".join(b for b in text_bits if b).strip() or None
        return LLMResult(text=text, tool_call=call)
