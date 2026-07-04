"""Phase 3 LLM Client — LiteLLM-wrapped chat + stream."""

from __future__ import annotations

import time
from collections.abc import AsyncIterator

import litellm

from app.services.knlg_base.llm.cost_guard import KnlgLlmCostGuard
from app.services.knlg_base.llm.exceptions import (
    KnlgLlmAuthError,
    KnlgLlmContextOverflowError,
    KnlgLlmError,
    KnlgLlmRateLimitError,
    KnlgLlmTimeoutError,
    KnlgLlmUnavailableError,
)
from app.services.knlg_base.llm.router import KnlgLlmRouter, ResolvedTarget, is_retryable_error, raise_after_chain
from app.services.knlg_base.llm.types import LlmChunk, LlmRequest, LlmResponse


class KnlgLlmClient:
    """Async LLM client with rate limiting, fallback chain, and error normalization."""

    def __init__(
        self,
        router: KnlgLlmRouter | None = None,
        cost_guard: KnlgLlmCostGuard | None = None,
    ):
        self.router = router or KnlgLlmRouter()
        self.cost_guard = cost_guard or KnlgLlmCostGuard()
        # Suppress LiteLLM's verbose logging to our loggers; we have our own audit
        litellm.suppress_debug_info = True

    async def chat(self, request: LlmRequest) -> LlmResponse:
        """Synchronous chat with fallback chain. Returns full response."""
        if request.user_id:
            self.cost_guard.check_and_increment(request.user_id)

        target = self.router.resolve(request.model)
        last_exc: Exception | None = None
        attempts = 0

        for resolved in self.router.iter_fallbacks(target):
            attempts += 1
            try:
                return await self._do_chat(resolved, request)
            except Exception as exc:
                last_exc = exc
                if not is_retryable_error(exc):
                    raise
                # else: continue to next fallback

        # Exhausted fallbacks
        raise_after_chain(last_exc or KnlgLlmUnavailableError("No attempts"), attempts)

    async def stream(self, request: LlmRequest) -> AsyncIterator[LlmChunk]:
        """Streaming chat. Yields chunks; no fallback mid-stream (single call only)."""
        if request.user_id:
            self.cost_guard.check_and_increment(request.user_id)

        target = self.router.resolve(request.model)
        started = time.time()
        try:
            response = await litellm.acompletion(
                model=f"{target.provider}/{target.model_id}",
                messages=request.messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_p=request.top_p,
                stream=True,
            )
        except Exception as exc:
            raise self._normalize_error(exc) from exc

        async for raw_chunk in response:
            try:
                chunk = self._normalize_chunk(raw_chunk, target)
            except Exception:
                continue
            yield chunk
        _ = started  # captured for future logging

    async def _do_chat(self, target: ResolvedTarget, request: LlmRequest) -> LlmResponse:
        started = time.time()
        try:
            resp = await litellm.acompletion(
                model=f"{target.provider}/{target.model_id}",
                messages=request.messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                top_p=request.top_p,
                stream=False,
            )
        except Exception as exc:
            raise self._normalize_error(exc) from exc

        duration_ms = int((time.time() - started) * 1000)
        usage = getattr(resp, "usage", None) or {}
        return LlmResponse(
            content=self._extract_content(resp),
            model=f"{target.provider}/{target.model_id}",
            finish_reason=getattr(resp.choices[0], "finish_reason", "stop") if resp.choices else "stop",
            prompt_tokens=getattr(usage, "prompt_tokens", 0) or 0,
            completion_tokens=getattr(usage, "completion_tokens", 0) or 0,
            total_tokens=getattr(usage, "total_tokens", 0) or 0,
            cost_usd=self._estimate_cost(target, usage),
            duration_ms=duration_ms,
        )

    @staticmethod
    def _extract_content(resp) -> str:
        try:
            return resp.choices[0].message.content or ""
        except (AttributeError, IndexError):
            return ""

    @staticmethod
    def _normalize_chunk(raw, target: ResolvedTarget) -> LlmChunk:
        delta = ""
        finish = None
        try:
            choice = raw.choices[0]
            delta = getattr(choice.delta, "content", "") or ""
            finish = getattr(choice, "finish_reason", None)
        except (AttributeError, IndexError):
            pass
        return LlmChunk(
            delta=delta,
            finish_reason=finish,
            index=0,
            model=f"{target.provider}/{target.model_id}",
        )

    @staticmethod
    def _estimate_cost(target: ResolvedTarget, usage) -> float:
        """Phase 3 MVP: rough cost estimation. Phase 4+ should use litellm.completion_cost."""
        # Rough per-1k token prices (USD), conservative
        prices = {
            ("openai", "gpt-4o"): {"in": 0.005, "out": 0.015},
            ("openai", "gpt-4o-mini"): {"in": 0.00015, "out": 0.0006},
            ("anthropic", "claude-3-5-sonnet"): {"in": 0.003, "out": 0.015},
            # MiniMax API pricing — provider-specific (MiniMax Anthropic-compatible)
            ("anthropic", "MiniMax-M2.7"): {"in": 0.001, "out": 0.003},
        }
        rate = prices.get((target.provider, target.model_id), {"in": 0.001, "out": 0.003})
        prompt_tokens = getattr(usage, "prompt_tokens", 0) or 0
        completion_tokens = getattr(usage, "completion_tokens", 0) or 0
        return (prompt_tokens / 1000) * rate["in"] + (completion_tokens / 1000) * rate["out"]

    @staticmethod
    def _normalize_error(exc: Exception) -> KnlgLlmError:
        """Map provider-specific errors to KnlgLlmError hierarchy."""
        name = exc.__class__.__name__.lower()
        msg = str(exc)
        if "timeout" in name or "timeout" in msg.lower():
            return KnlgLlmTimeoutError(msg)
        if "ratelimit" in name or "rate_limit" in msg.lower() or "429" in msg:
            return KnlgLlmRateLimitError(msg)
        if "auth" in name or "401" in msg or "permission" in msg.lower():
            return KnlgLlmAuthError(msg)
        if "context_length" in name or "context_length_exceeded" in msg.lower():
            return KnlgLlmContextOverflowError(msg)
        if "unavailable" in name or "503" in msg or "502" in msg or "500" in msg:
            return KnlgLlmUnavailableError(msg)
        # Fallback: wrap
        return KnlgLlmError(msg)


# Convenience singleton
_default_client: KnlgLlmClient | None = None


def get_default_llm_client() -> KnlgLlmClient:
    global _default_client
    if _default_client is None:
        _default_client = KnlgLlmClient()
    return _default_client
