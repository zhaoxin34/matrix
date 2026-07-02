"""Phase 3 LLM error hierarchy."""

from __future__ import annotations


class KnlgLlmError(Exception):
    """Base LLM error."""

    code: str = "ERR_LLM_UNKNOWN"
    retryable: bool = False

    def __init__(self, message: str, provider_code: str | None = None):
        super().__init__(message)
        self.provider_code = provider_code


class KnlgLlmTimeoutError(KnlgLlmError):
    code = "ERR_LLM_TIMEOUT"
    retryable = True


class KnlgLlmRateLimitError(KnlgLlmError):
    code = "ERR_LLM_RATE_LIMIT"
    retryable = True


class KnlgLlmAuthError(KnlgLlmError):
    code = "ERR_LLM_AUTH"
    retryable = False


class KnlgLlmUnavailableError(KnlgLlmError):
    code = "ERR_LLM_UNAVAILABLE"
    retryable = True


class KnlgLlmContextOverflowError(KnlgLlmError):
    code = "ERR_LLM_CONTEXT_OVERFLOW"
    retryable = False
