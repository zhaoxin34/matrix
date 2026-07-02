"""Phase 3 AI Interview Agent state machine."""

from __future__ import annotations

from enum import Enum


class AiSessionStatus(str, Enum):
    """AI interview session states (6 states per design)."""

    DRAFT = "draft"
    AI_PROBING = "ai_probing"
    WAITING_FOR_CONTEXT = "waiting_for_context"
    AI_SUMMARIZING = "ai_summarizing"
    COMPLETED = "completed"
    PAUSED = "paused"
    ABANDONED = "abandoned"


# Allowed transitions
_TRANSITIONS: dict[AiSessionStatus, set[AiSessionStatus]] = {
    AiSessionStatus.DRAFT: {AiSessionStatus.AI_PROBING, AiSessionStatus.ABANDONED},
    AiSessionStatus.AI_PROBING: {
        AiSessionStatus.AI_SUMMARIZING,
        AiSessionStatus.WAITING_FOR_CONTEXT,
        AiSessionStatus.PAUSED,
        AiSessionStatus.ABANDONED,
    },
    AiSessionStatus.WAITING_FOR_CONTEXT: {
        AiSessionStatus.AI_PROBING,
        AiSessionStatus.PAUSED,
        AiSessionStatus.ABANDONED,
    },
    AiSessionStatus.AI_SUMMARIZING: {
        AiSessionStatus.COMPLETED,
        AiSessionStatus.ABANDONED,
    },
    AiSessionStatus.COMPLETED: set(),  # terminal
    AiSessionStatus.PAUSED: {
        AiSessionStatus.AI_PROBING,
        AiSessionStatus.ABANDONED,
    },
    AiSessionStatus.ABANDONED: set(),  # terminal
}


class IllegalTransitionError(Exception):
    def __init__(self, from_status: str, to_status: str):
        super().__init__(f"Illegal transition: {from_status} -> {to_status}")
        self.from_status = from_status
        self.to_status = to_status


def can_transition(from_status: str, to_status: str) -> bool:
    """Check if a state transition is allowed."""
    try:
        f = AiSessionStatus(from_status)
        t = AiSessionStatus(to_status)
    except ValueError:
        return False
    return t in _TRANSITIONS.get(f, set())


def assert_transition(from_status: str, to_status: str) -> None:
    """Raise if transition is not allowed."""
    if not can_transition(from_status, to_status):
        raise IllegalTransitionError(from_status, to_status)


def allowed_next(from_status: str) -> set[str]:
    """Get the set of statuses reachable from given status."""
    try:
        f = AiSessionStatus(from_status)
    except ValueError:
        return set()
    return {s.value for s in _TRANSITIONS.get(f, set())}


def is_terminal(status: str) -> bool:
    """A session in a terminal state cannot transition further."""
    return status in {AiSessionStatus.COMPLETED.value, AiSessionStatus.ABANDONED.value}
