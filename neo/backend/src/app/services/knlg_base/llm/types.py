"""Phase 3 LLM Gateway types."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class LlmRequest(BaseModel):
    """Single LLM call request."""

    model: str = Field(..., description="provider/model_id e.g. 'openai/gpt-4o'")
    messages: list[dict[str, Any]] = Field(..., description="OpenAI-style messages")
    temperature: float = 0.7
    max_tokens: int | None = None
    top_p: float | None = None
    stream: bool = False
    workspace_id: int | None = None
    user_id: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class LlmResponse(BaseModel):
    """LLM call response (non-streaming)."""

    content: str
    model: str
    finish_reason: str = "stop"
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    duration_ms: int = 0
    request_id: str | None = None


class LlmChunk(BaseModel):
    """Single chunk in a streaming response."""

    delta: str
    finish_reason: str | None = None
    index: int = 0
    model: str | None = None
    usage: dict[str, int] | None = None


class LlmErrorInfo(BaseModel):
    """Normalized LLM error info (for logging)."""

    code: str
    message: str
    retryable: bool
    provider_code: str | None = None
