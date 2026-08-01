from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ToolCall:
    id: str
    name: str
    args: dict


@dataclass
class LLMResult:
    """Normalized model turn: an optional bit of reasoning text plus at most one
    tool call. A result with text and no tool call is treated as a final answer."""

    text: str | None = None
    tool_call: ToolCall | None = None


class LLMProvider(ABC):
    name = "base"

    @abstractmethod
    def generate(
        self, system: str, transcript: list[dict], tools: list[dict]
    ) -> LLMResult:
        """Given the system prompt, the normalized transcript, and the tool schemas,
        return the model's next turn.

        Transcript entries are one of:
          {"role": "user", "text": str}
          {"role": "assistant", "text": str | None, "tool_call": {id,name,args} | None}
          {"role": "tool", "tool_call_id": str, "name": str, "text": str}
        """
        raise NotImplementedError
