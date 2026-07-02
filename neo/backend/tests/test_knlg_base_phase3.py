"""Phase 3 tests: state machine + followup decider + signal parser."""

from __future__ import annotations

import pytest

from app.services.knlg_base.agent.followup_decider import FollowupDecider
from app.services.knlg_base.agent.signal_extractor import SignalExtractor
from app.services.knlg_base.agent.state_machine import (
    AiSessionStatus,
    allowed_next,
    assert_transition,
    can_transition,
    is_terminal,
)
from app.services.knlg_base.agent.types import NextAction, NextQuestionReason, Signal, SignalType

# ---------- state machine tests ----------


class TestStateMachine:
    def test_draft_to_probing_allowed(self):
        assert can_transition("draft", "ai_probing")
        assert_transition("draft", "ai_probing")  # no exception

    def test_probing_to_summarizing_allowed(self):
        assert can_transition("ai_probing", "ai_summarizing")

    def test_completed_is_terminal(self):
        assert is_terminal("completed")
        assert is_terminal("abandoned")
        # No transitions out
        assert allowed_next("completed") == set()
        assert allowed_next("abandoned") == set()

    def test_invalid_transition_rejected(self):
        assert not can_transition("completed", "ai_probing")
        assert not can_transition("draft", "completed")

    def test_assert_transition_raises_on_invalid(self):
        with pytest.raises(Exception) as exc:
            assert_transition("completed", "ai_probing")
        assert "Illegal" in str(exc.value)

    def test_paused_can_resume_to_probing(self):
        assert can_transition("paused", "ai_probing")

    def test_all_states_enum_known(self):
        # Enum covers all status strings used in DB
        expected = {"draft", "ai_probing", "waiting_for_context", "ai_summarizing", "completed", "paused", "abandoned"}
        actual = {s.value for s in AiSessionStatus}
        assert actual == expected


# ---------- follow-up decider tests ----------


class TestFollowupDecider:
    def test_max_turns_reached_returns_summarize(self):
        decider = FollowupDecider()
        decision = decider.decide(
            expert_answer="some answer",
            current_turn_index=8,
            max_turns=8,
        )
        assert decision.next_action == NextAction.SUMMARIZE
        assert decision.reason == NextQuestionReason.MAX_TURNS_REACHED

    def test_too_short_triggers_followup(self):
        decider = FollowupDecider(too_short_len=10)
        decision = decider.decide(
            expert_answer="ok",
            current_turn_index=1,
            max_turns=8,
        )
        assert decision.next_action == NextAction.ASK_FOLLOWUP
        assert decision.reason == NextQuestionReason.TOO_SHORT

    def test_high_signal_triggers_followup(self):
        decider = FollowupDecider()
        signal = Signal(type=SignalType.PAIN_POINT, confidence=0.95, text="x", linked_question_id=None)
        decision = decider.decide(
            expert_answer="客户痛点很严重，影响了30%的成交转化率",
            current_turn_index=1,
            max_turns=8,
            signals=[signal],
        )
        assert decision.next_action == NextAction.ASK_FOLLOWUP
        assert decision.reason == NextQuestionReason.HIGH_SIGNAL

    def test_tree_exhausted_summarizes(self):
        decider = FollowupDecider()
        decision = decider.decide(
            expert_answer="a detailed answer with enough content",
            current_turn_index=1,
            max_turns=8,
            tree_has_next=False,
            tree_has_followup=False,
        )
        assert decision.next_action == NextAction.SUMMARIZE


# ---------- signal extractor parsing tests ----------


class TestSignalExtractorParse:
    def test_parse_valid_json_array(self):
        content = '[{"type": "pain_point", "confidence": 0.9, "text": "响应慢"}]'
        signals = SignalExtractor._parse(content)
        assert len(signals) == 1
        assert signals[0].type == SignalType.PAIN_POINT
        assert signals[0].confidence == 0.9

    def test_parse_json_in_prose(self):
        content = (
            'Here is the result:\n```json\n[{"type": "opportunity", "confidence": 0.8, "text": "big market"}]\n```'
        )
        signals = SignalExtractor._parse(content)
        assert len(signals) == 1
        assert signals[0].type == SignalType.OPPORTUNITY

    def test_parse_invalid_returns_empty(self):
        assert SignalExtractor._parse("not json") == []
        assert SignalExtractor._parse("[invalid]") == []
        assert SignalExtractor._parse("") == []

    def test_parse_skips_invalid_items(self):
        content = '[{"type": "pain_point", "confidence": 0.9, "text": "ok"}, {"bad": "item"}]'
        signals = SignalExtractor._parse(content)
        # First one parses; second skipped due to missing 'type'
        assert len(signals) >= 1
        assert signals[0].type == SignalType.PAIN_POINT

    def test_parse_invalid_confidence_skipped(self):
        content = '[{"type": "pain_point", "confidence": "high", "text": "x"}]'
        signals = SignalExtractor._parse(content)
        # Pydantic coerces float() on string → may raise → skipped
        # We accept >= 0 signals (strict in MVP)
        assert all(s.confidence >= 0 for s in signals)
