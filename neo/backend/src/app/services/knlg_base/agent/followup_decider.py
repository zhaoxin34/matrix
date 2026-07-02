"""Phase 3 Follow-up Decider (Decision #2 = Option A: fixed rules)."""

from __future__ import annotations

from typing import Any

from app.services.knlg_base.agent.types import (
    Decision,
    NextAction,
    NextQuestionReason,
    SignalType,
)

# Minimum answer length threshold
TOO_SHORT_LEN = 10

# Confidence thresholds
HIGH_SIGNAL_THRESHOLD = 0.8
LOW_SIGNAL_THRESHOLD = 0.3


class FollowupDecider:
    """Rule-based follow-up decision engine. 10 reason codes per design."""

    def __init__(
        self,
        too_short_len: int = TOO_SHORT_LEN,
        high_signal_threshold: float = HIGH_SIGNAL_THRESHOLD,
        low_signal_threshold: float = LOW_SIGNAL_THRESHOLD,
    ):
        self.too_short_len = too_short_len
        self.high_signal_threshold = high_signal_threshold
        self.low_signal_threshold = low_signal_threshold

    def decide(
        self,
        *,
        expert_answer: str,
        current_turn_index: int,
        max_turns: int,
        signals: list[Any] | None = None,
        tree_has_next: bool = False,
        tree_has_followup: bool = False,
        next_tree_question: dict | None = None,
    ) -> Decision:
        """Compute next action + reason based on state."""
        signals = signals or []

        # Rule 1: Max turns reached → SUMMARIZE
        if current_turn_index >= max_turns:
            return Decision(
                next_action=NextAction.SUMMARIZE,
                reason=NextQuestionReason.MAX_TURNS_REACHED,
                rationale=f"Reached max_turns={max_turns}",
            )

        # Rule 2: Answer too short → ASK_FOLLOWUP
        if len(expert_answer.strip()) < self.too_short_len:
            return Decision(
                next_action=NextAction.ASK_FOLLOWUP,
                reason=NextQuestionReason.TOO_SHORT,
                question_text="能再详细说说吗？",
                rationale=f"Expert answer ({len(expert_answer.strip())} chars) below threshold",
            )

        # Rule 3: High signal detected → ASK_FOLLOWUP to dig deeper
        high_signals = [s for s in signals if getattr(s, "confidence", 0) >= self.high_signal_threshold]
        if high_signals:
            sig = high_signals[0]
            q = self._high_signal_followup(sig)
            return Decision(
                next_action=NextAction.ASK_FOLLOWUP,
                reason=NextQuestionReason.HIGH_SIGNAL,
                question_text=q,
                question_id=getattr(sig, "linked_question_id", None),
                rationale=f"High-confidence signal ({sig.confidence:.2f}) of type {sig.type}",
            )

        # Rule 4: Tree has followup → ASK_FOLLOWUP
        if tree_has_followup:
            return Decision(
                next_action=NextAction.ASK_FOLLOWUP,
                reason=NextQuestionReason.TREE_FOLLOWUP,
                question_text=None,  # filled by caller from tree
                rationale="Question tree has followup",
            )

        # Rule 5: Tree has next → NEXT_QUESTION
        if tree_has_next and next_tree_question:
            return Decision(
                next_action=NextAction.NEXT_QUESTION,
                reason=NextQuestionReason.TREE_NEXT,
                question_text=next_tree_question.get("text"),
                question_id=next_tree_question.get("id"),
                rationale="Move to next question in tree",
            )

        # Rule 6: Low signals throughout → ASK_FOLLOWUP to elicit more
        if signals and all(getattr(s, "confidence", 0) < self.low_signal_threshold for s in signals):
            return Decision(
                next_action=NextAction.ASK_FOLLOWUP,
                reason=NextQuestionReason.LOW_SIGNAL,
                question_text="能给我一个具体的例子吗？",
                rationale="No high-confidence signals detected",
            )

        # Rule 7: No tree, no signal, answer seems complete → SUMMARIZE
        if not tree_has_next and not tree_has_followup:
            return Decision(
                next_action=NextAction.SUMMARIZE,
                reason=NextQuestionReason.TREE_NEXT,  # tree exhausted
                rationale="No more questions in tree; summarizing",
            )

        # Default: WAIT_EXPERT
        return Decision(
            next_action=NextAction.WAIT_EXPERT,
            reason=NextQuestionReason.TREE_NEXT,
            rationale="Default: waiting for expert",
        )

    @staticmethod
    def _high_signal_followup(signal) -> str:
        """Generate a follow-up question for a high-confidence signal."""
        sig_type = signal.type if isinstance(signal.type, SignalType) else SignalType(signal.type)
        templates = {
            SignalType.PAIN_POINT: "这个痛点有多严重？影响多少人？",
            SignalType.OPPORTUNITY: "这个机会有多大？能详细描述一下吗？",
            SignalType.COUNTER_EXAMPLE: "能举个反例吗？什么情况下不适用？",
            SignalType.BOUNDARY: "这个边界条件具体是什么？",
            SignalType.KEY_METRIC: "这个数字的来源是？对比基准是什么？",
        }
        return templates.get(sig_type, "能再具体说说吗？")
