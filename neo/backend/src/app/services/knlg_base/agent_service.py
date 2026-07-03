"""Phase 3 AI Interview Agent service (orchestrator)."""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.orm import Session

from app.core.error_codes import ERR_INVALID_PARAMETER, ERR_NOT_FOUND
from app.core.exceptions import BusinessException
from app.models.knlg_interview_session import KnlgInterviewSession
from app.repositories.knlg_base.agent import (
    AiSessionRepository,
    AiTurnRepository,
    PromptSnapshotRepository,
    SignalRepository,
)
from app.services.knlg_base.agent.followup_decider import FollowupDecider
from app.services.knlg_base.agent.signal_extractor import SignalExtractor
from app.services.knlg_base.agent.state_machine import (
    AiSessionStatus,
    assert_transition,
    can_transition,
    is_terminal,
)
from app.services.knlg_base.agent.summarizer import InterviewSummarizer
from app.services.knlg_base.agent.types import (
    Decision,
    NextAction,
    Signal,
    SseEvent,
)
from app.services.knlg_base.base import KnlgBaseService


class KnlgInterviewAgentService(KnlgBaseService):
    """Main orchestrator for AI interview sessions."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.db = db
        self.sessions = AiSessionRepository(db)
        self.turns = AiTurnRepository(db)
        self.signals = SignalRepository(db)
        self.snapshots = PromptSnapshotRepository(db)
        self.decider = FollowupDecider()
        self.extractor = SignalExtractor()
        self.summarizer = InterviewSummarizer()

    # ---------- session lifecycle ----------

    def start_session(
        self,
        *,
        workspace_id: int,
        expert_id: int,
        topic: str,
        tree_id: int | None,
        max_turns: int,
        created_by: int,
    ) -> KnlgInterviewSession:
        """Create a new AI session (mode='ai_agent') in 'draft' state."""
        if not topic:
            raise BusinessException(ERR_INVALID_PARAMETER, "topic required")
        if max_turns <= 0 or max_turns > 50:
            raise BusinessException(ERR_INVALID_PARAMETER, "max_turns must be 1-50")

        sess = self.sessions.create_ai_session(
            workspace_id=workspace_id,
            expert_id=expert_id,
            topic=topic,
            tree_id=tree_id,
            max_turns=max_turns,
            created_by=created_by,
        )
        self.db.commit()
        return sess

    def get_session(self, workspace_id: int, session_id: int) -> KnlgInterviewSession:
        sess = self.sessions.get_for_workspace(session_id, workspace_id)
        if not sess:
            raise BusinessException(ERR_NOT_FOUND, "AI session not found")
        if sess.mode != "ai_agent":
            raise BusinessException(ERR_INVALID_PARAMETER, "Session is not an AI session")
        return sess

    def list_sessions(
        self, workspace_id: int, page: int = 1, page_size: int = 20, status: str | None = None
    ) -> tuple[list[KnlgInterviewSession], int]:
        return self.sessions.list_ai(workspace_id, page, page_size, status)

    def transition(self, sess: KnlgInterviewSession, new_status: str) -> KnlgInterviewSession:
        assert_transition(sess.status, new_status)
        sess = self.sessions.update_status(sess, new_status)
        self.db.commit()
        return sess

    # ---------- turn processing ----------

    async def process_turn(
        self,
        *,
        workspace_id: int,
        session_id: int,
        expert_answer: str,
    ) -> AsyncIterator[SseEvent]:
        """Process expert's answer; yield SSE events for the next question/summary."""
        sess = self.get_session(workspace_id, session_id)

        if is_terminal(sess.status):
            yield SseEvent(event="error", data={"code": "ERR_AI_TERMINAL", "message": f"Session is {sess.status}"})
            return

        if sess.status != AiSessionStatus.AI_PROBING.value:
            # Auto-transition to ai_probing
            if can_transition(sess.status, AiSessionStatus.AI_PROBING.value):
                sess = self.transition(sess, AiSessionStatus.AI_PROBING.value)
            else:
                msg = f"Bad state: {sess.status}"
                yield SseEvent(event="error", data={"code": "ERR_AI_INVALID_STATE", "message": msg})
                return

        # Yield a "received" marker
        yield SseEvent(event="turn_received", data={"turnIndex": sess.current_turn_index})

        # Extract signals from the expert's answer
        prev_turn = self.turns.list_by_session(sess.id)[-1] if self.turns.list_by_session(sess.id) else None
        signals: list[Signal] = []
        if prev_turn and expert_answer:
            extraction = await self.extractor.extract(
                question=prev_turn.user_question_text,
                answer=expert_answer,
            )
            signals = extraction.signals
            for sig in signals:
                self.signals.create(
                    session_id=sess.id,
                    source_turn_id=prev_turn.id,
                    type=sig.type.value,
                    confidence=sig.confidence,
                    text=sig.text,
                    workspace_id=workspace_id,
                    linked_question_id=sig.linked_question_id,
                    metadata=sig.metadata,
                )
                yield SseEvent(
                    event="signal_detected",
                    data={
                        "type": sig.type.value,
                        "confidence": sig.confidence,
                        "text": sig.text,
                        "linkedQuestionId": sig.linked_question_id,
                    },
                )
        self.db.commit()

        # Decide next action
        decision: Decision = self.decider.decide(
            expert_answer=expert_answer,
            current_turn_index=sess.current_turn_index,
            max_turns=sess.max_turns,
            signals=signals,
            tree_has_next=False,  # MVP: no tree navigation
            tree_has_followup=False,
            next_tree_question=None,
        )

        if decision.next_action == NextAction.SUMMARIZE:
            # Transition to summarizing
            sess = self.transition(sess, AiSessionStatus.AI_SUMMARIZING.value)
            # Generate summary
            turns_data = [
                {"question": t.user_question_text, "answer": t.expert_answer_text or ""}
                for t in self.turns.list_by_session(sess.id)
            ]
            counts = self.signals.count_by_type(sess.id)
            summary = await self.summarizer.summarize(
                topic=sess.topic,
                turns=turns_data,
                signal_counts=counts,
            )
            sess = self.sessions.update_summary(sess, summary.full_text)
            sess = self.transition(sess, AiSessionStatus.COMPLETED.value)
            yield SseEvent(
                event="summary_ready",
                data={
                    "summary": summary.full_text,
                    "keyFindings": summary.key_findings,
                    "suggestedKcCount": summary.suggested_kc_count,
                    "signalCount": summary.signal_count,
                },
            )
            yield SseEvent(event="done", data={"status": "completed"})
            return

        # Create next turn
        question_text = decision.question_text or "请继续。"
        next_idx = (sess.current_turn_index or 0) + 1
        self.turns.create(
            session_id=sess.id,
            turn_index=next_idx,
            user_question_text=question_text,
            workspace_id=workspace_id,
            user_question_id=decision.question_id,
            next_question_reason=decision.reason.value,
        )
        sess = self.sessions.increment_turn_index(sess)
        self.db.commit()

        yield SseEvent(
            event="question_proposed",
            data={
                "turnIndex": next_idx,
                "question": question_text,
                "reason": decision.reason.value,
                "rationale": decision.rationale,
            },
        )
        yield SseEvent(event="done", data={"status": "ai_probing"})

    # ---------- explicit control ----------

    def pause(self, workspace_id: int, session_id: int) -> KnlgInterviewSession:
        sess = self.get_session(workspace_id, session_id)
        return self.transition(sess, AiSessionStatus.PAUSED.value)

    def abandon(self, workspace_id: int, session_id: int, reason: str | None = None) -> KnlgInterviewSession:
        sess = self.get_session(workspace_id, session_id)
        if reason and sess.status == AiSessionStatus.WAITING_FOR_CONTEXT.value:
            sess.waiting_reason = reason
        return self.transition(sess, AiSessionStatus.ABANDONED.value)

    def update_last_event(self, workspace_id: int, session_id: int, last_event_id: str) -> None:
        sess = self.get_session(workspace_id, session_id)
        self.sessions.update_last_event(sess, last_event_id)
        self.db.commit()
