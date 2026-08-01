import httpx

from .base import LLMProvider, LLMResult, ToolCall

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


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
        with httpx.Client(timeout=45) as client:
            resp = client.post(
                GEMINI_URL.format(model=self.model),
                params={"key": self.api_key},
                json=body,
            )
        resp.raise_for_status()
        return self._parse(resp.json())

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
                    parts.append(
                        {"functionCall": {"name": tc["name"], "args": tc["args"] or {}}}
                    )
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
                call = ToolCall(id="call", name=fc.get("name", ""), args=fc.get("args") or {})
        text = "\n".join(b for b in text_bits if b).strip() or None
        return LLMResult(text=text, tool_call=call)
