"""Phase 3 LLM Router — provider/model selection with fallback chain."""

from __future__ import annotations

from dataclasses import dataclass

from app.services.knlg_base.llm.exceptions import KnlgLlmUnavailableError


@dataclass
class ResolvedTarget:
    """A resolved provider+model ready for LiteLLM call."""

    provider: str
    model_id: str
    api_base: str | None
    api_key: str | None
    is_fallback: bool = False


class KnlgLlmRouter:
    """Selects provider/model for a request. Falls back to alternate models on failure.

    Phase 3 MVP: in-memory config; Phase 4: load from knlg_llm_provider/model tables
    with caching.
    """

    DEFAULT_CHAIN = [
        ("anthropic", "MiniMax-M2.7"),
        ("anthropic", "claude-3-5-sonnet"),
    ]

    def __init__(self, chain: list[tuple[str, str]] | None = None):
        self.chain = chain or list(self.DEFAULT_CHAIN)

    def resolve(self, requested_model: str) -> ResolvedTarget:
        """Resolve a model string ('provider/model_id') into a callable target.

        If the requested model isn't in the chain, prepend it so it's tried first.
        """
        # Parse provider/model_id
        if "/" in requested_model:
            provider, model_id = requested_model.split("/", 1)
        else:
            provider, model_id = "openai", requested_model

        # Find in chain (or treat as single-call, no fallback)
        if (provider, model_id) in self.chain:
            return ResolvedTarget(provider=provider, model_id=model_id, api_base=None, api_key=None)
        # Ad-hoc model: use as-is with fallback to chain tail
        return ResolvedTarget(
            provider=provider,
            model_id=model_id,
            api_base=None,
            api_key=None,
        )

    def fallback_for(self, target: ResolvedTarget) -> ResolvedTarget | None:
        """Return next fallback in chain, or None if exhausted."""
        try:
            idx = self.chain.index((target.provider, target.model_id))
        except ValueError:
            idx = -1
        next_idx = idx + 1
        if next_idx >= len(self.chain):
            return None
        provider, model_id = self.chain[next_idx]
        return ResolvedTarget(
            provider=provider,
            model_id=model_id,
            api_base=None,
            api_key=None,
            is_fallback=True,
        )

    def iter_fallbacks(self, target: ResolvedTarget):
        """Yield target first, then all fallbacks."""
        yield target
        current = target
        while True:
            nxt = self.fallback_for(current)
            if nxt is None:
                return
            yield nxt
            current = nxt


def is_retryable_error(exc: Exception) -> bool:
    """Inspect an exception to decide if fallback should be tried."""
    from app.services.knlg_base.llm.exceptions import KnlgLlmError

    if isinstance(exc, KnlgLlmError):
        return exc.retryable
    # Unknown errors: not retryable by default
    return False


def raise_after_chain(exc: Exception, attempts: int) -> None:
    """Raise an unavailable error if all fallbacks exhausted."""
    if attempts <= 1:
        # No fallback was attempted; re-raise original
        raise exc
    raise KnlgLlmUnavailableError(f"All {attempts} fallback attempts failed; last error: {exc}")
