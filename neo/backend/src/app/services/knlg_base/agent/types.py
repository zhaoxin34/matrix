"""Phase 3 AI Agent types."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class NextAction(str, Enum):
    """Follow-up decider next action enum."""

    WAIT_EXPERT = "wait_expert"
    ASK_FOLLOWUP = "ask_followup"
    NEXT_QUESTION = "next_question"
    SUMMARIZE = "summarize"


class NextQuestionReason(str, Enum):
    """10 follow-up reason codes (Phase 3 decision #2 = Option A)."""

    TREE_NEXT = "tree_next"
    TREE_FOLLOWUP = "tree_followup"
    TOO_SHORT = "too_short"
    TOO_VAGUE = "too_vague"
    MISSING_EXAMPLE = "missing_example"
    MISSING_METRIC = "missing_metric"
    HIGH_SIGNAL = "high_signal"
    LOW_SIGNAL = "low_signal"
    MAX_TURNS_REACHED = "max_turns_reached"
    EXPERT_REQUEST_PAUSE = "expert_request_pause"


class Decision(BaseModel):
    """Follow-up decider output."""

    next_action: NextAction
    reason: NextQuestionReason
    question_text: str | None = None
    question_id: int | None = None  # if from question tree
    rationale: str = ""


class SignalType(str, Enum):
    """5 signal types (Phase 3 decision #3 = Option A)."""

    PAIN_POINT = "pain_point"
    OPPORTUNITY = "opportunity"
    COUNTER_EXAMPLE = "counter_example"
    BOUNDARY = "boundary"
    KEY_METRIC = "key_metric"


class Signal(BaseModel):
    """A single extracted signal."""

    type: SignalType
    confidence: float = Field(..., ge=0.0, le=1.0)
    text: str
    linked_question_id: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SignalExtractionResult(BaseModel):
    """Result of signal extraction from an expert answer."""

    signals: list[Signal]


class InterviewSummary(BaseModel):
    """AI-generated interview summary."""

    key_findings: list[str]
    suggested_kc_count: int = 0
    signal_count: int = 0
    full_text: str


class SseEvent(BaseModel):
    """Server-Sent Event payload."""

    event: str  # event type (e.g. 'message_start', 'content_delta')
    id: str | None = None  # event id (for Last-Event-ID)
    data: dict[str, Any] = Field(default_factory=dict)


# Re-export status for convenience
from app.services.knlg_base.agent.state_machine import (  # noqa: E402
    AiSessionStatus,
    IllegalTransitionError,
    allowed_next,
    assert_transition,
    can_transition,
    is_terminal,
)

__all__ = [
    "NextAction",
    "NextQuestionReason",
    "Decision",
    "SignalType",
    "Signal",
    "SignalExtractionResult",
    "InterviewSummary",
    "SseEvent",
    "AiSessionStatus",
    "IllegalTransitionError",
    "can_transition",
    "assert_transition",
    "allowed_next",
    "is_terminal",
]
