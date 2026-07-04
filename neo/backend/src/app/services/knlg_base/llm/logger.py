"""Phase 3 LLM call audit logger.

Writes normalized LLM call records (success or failure) so that the spec's
"100% 调用落日志" requirement is met. Each call produces a structured
dict compatible with `knlg_interview_ai_turn.llm_request_log` JSON field.

Usage::

    logger = KnlgLlmLogger()
    log = logger.make_log(success=True, request=req, response=resp, ttft_ms=...)
    # log is the JSON-serializable dict ready for `llm_request_log` column.

The logger is intentionally side-effect free at the call site; the
caller (agent_service / signal_extractor / summarizer) decides where
the log lands (DB row vs SSE event).
"""

from __future__ import annotations

import time
from typing import Any

from app.services.knlg_base.llm.exceptions import KnlgLlmError
from app.services.knlg_base.llm.types import LlmErrorInfo, LlmRequest, LlmResponse


class KnlgLlmLogger:
    """Build audit-log dicts for LLM calls.

    Per spec llm-gateway §"可观测（调用日志）":
    JSON contains `model / prompt_tokens / completion_tokens / duration_ms /
    ttft_ms / finish_reason / error` (if failed).
    """

    def make_log(
        self,
        *,
        request: LlmRequest,
        success: bool,
        response: LlmResponse | None = None,
        error: KnlgLlmError | None = None,
        ttft_ms: int | None = None,
        duration_ms: int | None = None,
        started_at: float | None = None,
    ) -> dict[str, Any]:
        """Return a JSON-serializable record. No I/O is performed."""
        now = time.time()
        started = started_at if started_at is not None else now
        # Prefer explicit duration_ms; else use the response's pre-measured
        # duration_ms; else estimate from clock arithmetic.
        if duration_ms is not None:
            dur = duration_ms
        elif response is not None and response.duration_ms:
            dur = response.duration_ms
        else:
            dur = int((now - started) * 1000)

        record: dict[str, Any] = {
            "model": request.model,
            "workspace_id": request.workspace_id,
            "user_id": request.user_id,
            "duration_ms": dur,
            "temperature": request.temperature,
            "stream": request.stream,
            "success": success,
        }
        if ttft_ms is not None:
            record["ttft_ms"] = ttft_ms

        if success and response is not None:
            record["prompt_tokens"] = response.prompt_tokens
            record["completion_tokens"] = response.completion_tokens
            record["total_tokens"] = response.total_tokens
            record["cost_usd"] = response.cost_usd
            record["finish_reason"] = response.finish_reason
            if response.request_id:
                record["request_id"] = response.request_id
        elif not success and error is not None:
            err = LlmErrorInfo(
                code=error.code,
                message=str(error),
                retryable=getattr(error, "retryable", False),
            )
            record["error"] = err.model_dump()
        return record

    def format_for_storage(
        self,
        log: dict[str, Any],
    ) -> dict[str, Any]:
        """Trim audit record for `knlg_interview_ai_turn.llm_request_log`.

        Removes fields that are already encoded as columns on the row
        (workspace_id, user_id) so the JSON stays small and re-canonical.
        """
        out = dict(log)
        out.pop("workspace_id", None)
        out.pop("user_id", None)
        out.pop("temperature", None)
        out.pop("stream", None)
        return out
