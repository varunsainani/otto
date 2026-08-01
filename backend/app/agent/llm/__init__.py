from ...config import settings
from .base import LLMProvider, LLMResult, ToolCall
from .gemini import GeminiProvider
from .groq import GroqProvider
from .mock import MockProvider


def get_provider(name: str | None = None) -> LLMProvider:
    provider = (name or settings.llm_provider or "gemini").lower()
    if provider == "mock":
        return MockProvider()
    if provider == "groq" and settings.groq_api_key:
        return GroqProvider(settings.groq_api_key, settings.groq_model)
    if provider == "gemini" and settings.gemini_api_key:
        return GeminiProvider(settings.gemini_api_key, settings.gemini_model)
    # No usable key configured: fall back to the deterministic mock so runs still work.
    return MockProvider()


__all__ = ["get_provider", "LLMProvider", "LLMResult", "ToolCall"]
