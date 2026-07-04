"""Phase 3 LLM metrics aggregator.

Per spec llm-gateway §"可观测" + §"限流（按 user）":
- 调用成功率（success / total）
- 限流触发率（rate_limited / total）
- 信号识别 confidence 分布

Approach: in-process counters that emit a single JSON summary line on each
call (cheap, scrapable by filebeat / loki). Production swap-in can replace
the `emit` function with Prometheus / OTel later without changing callers.
"""

from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass
from threading import Lock

logger = logging.getLogger("knlg_base.llm.metrics")


@dataclass
class _Counters:
    total: int = 0
    success: int = 0
    failed: int = 0
    rate_limited: int = 0
    fallback_used: int = 0
    signal_confidence_sum: float = 0.0
    signal_confidence_count: int = 0

    def snapshot(self) -> dict[str, float]:
        total = max(self.total, 1)
        return {
            "calls_total": self.total,
            "calls_success": self.success,
            "calls_failed": self.failed,
            "calls_rate_limited": self.rate_limited,
            "calls_fallback_used": self.fallback_used,
            "success_rate": round(self.success / total, 4),
            "rate_limit_rate": round(self.rate_limited / total, 4),
            "signal_confidence_avg": (
                round(self.signal_confidence_sum / self.signal_confidence_count, 4)
                if self.signal_confidence_count
                else 0.0
            ),
            "signal_confidence_n": self.signal_confidence_count,
        }

    def reset(self) -> None:
        self.total = 0
        self.success = 0
        self.failed = 0
        self.rate_limited = 0
        self.fallback_used = 0
        self.signal_confidence_sum = 0.0
        self.signal_confidence_count = 0


_COUNTERS = _Counters()
_LOCK = Lock()
# Toggle for tests / opt-out
_ENABLED = os.environ.get("KNLG_LLM_METRICS_ENABLED", "true").lower() in ("1", "true", "yes")


def record_call(*, success: bool, fallback_used: bool = False, rate_limited: bool = False) -> None:
    """Bump call counters."""
    if not _ENABLED:
        return
    with _LOCK:
        _COUNTERS.total += 1
        if success:
            _COUNTERS.success += 1
        else:
            _COUNTERS.failed += 1
        if rate_limited:
            _COUNTERS.rate_limited += 1
        if fallback_used:
            _COUNTERS.fallback_used += 1


def record_signal_confidence(confidence: float) -> None:
    """Add one signal confidence sample to the running average."""
    if not _ENABLED:
        return
    if confidence < 0 or confidence > 1:
        return
    with _LOCK:
        _COUNTERS.signal_confidence_sum += float(confidence)
        _COUNTERS.signal_confidence_count += 1


def emit_snapshot(reason: str = "interval") -> dict[str, float]:
    """Snapshot the counters and log a JSON summary line.

    Returns the snapshot dict so callers can ship it via HTTP scrape.
    """
    with _LOCK:
        snap = _COUNTERS.snapshot()
        _COUNTERS.reset()
    if _ENABLED:
        logger.info(
            "knlg_llm_metrics",
            extra={"reason": reason, "ts": time.time(), **snap},
        )
    return snap
