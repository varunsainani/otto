from .base import LLMProvider, LLMResult, ToolCall


class MockProvider(LLMProvider):
    """Deterministic provider for offline tests and when no API key is set. Runs a
    fixed three-step plan so the loop, tool execution, and persistence can be
    validated without a network call."""

    name = "mock"

    def generate(self, system: str, transcript: list[dict], tools: list[dict]) -> LLMResult:
        prior_calls = [
            m for m in transcript if m["role"] == "assistant" and m.get("tool_call")
        ]
        n = len(prior_calls)
        if n == 0:
            return LLMResult(
                text="Let me review the open deals first.",
                tool_call=ToolCall("call", "query_records", {"entity": "deals", "filter": "open"}),
            )
        if n == 1:
            return LLMResult(
                text="I'll add a follow-up task for the top deal.",
                tool_call=ToolCall(
                    "call", "create_task", {"title": "Follow up on top open deal"}
                ),
            )
        return LLMResult(
            text=None,
            tool_call=ToolCall(
                "call",
                "finish",
                {"answer": "Reviewed the open deals and created a follow-up task."},
            ),
        )
