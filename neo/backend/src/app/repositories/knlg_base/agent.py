"""Phase 3 AI Agent repositories (session / turn / signal / snapshot)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.knlg_interview_ai_turn import KnlgInterviewAiTurn
from app.models.knlg_interview_session import KnlgInterviewSession
from app.models.knlg_prompt_version_snapshot import KnlgPromptVersionSnapshot
from app.models.knlg_signal import KnlgSignal


class AiSessionRepository:
    """CRUD for AI interview sessions (extends Phase 1 session)."""

    def __init__(self, session: Session):
        self.session = session

    def get(self, session_id: int) -> KnlgInterviewSession | None:
        return self.session.query(KnlgInterviewSession).filter(KnlgInterviewSession.id == session_id).first()

    def get_for_workspace(self, session_id: int, workspace_id: int) -> KnlgInterviewSession | None:
        return (
            self.session.query(KnlgInterviewSession)
            .filter(KnlgInterviewSession.id == session_id, KnlgInterviewSession.workspace_id == workspace_id)
            .first()
        )

    def create_ai_session(
        self,
        *,
        workspace_id: int,
        expert_id: int,
        topic: str,
        tree_id: int | None,
        max_turns: int,
        created_by: int,
    ) -> KnlgInterviewSession:
        sess = KnlgInterviewSession(
            workspace_id=workspace_id,
            expert_id=expert_id,
            topic=topic,
            mode="ai_agent",
            status="draft",
            tree_id=tree_id,
            max_turns=max_turns,
            current_turn_index=0,
            started_at=datetime.now(UTC),
            created_by=created_by,
        )
        self.session.add(sess)
        self.session.flush()
        return sess

    def update_status(self, sess: KnlgInterviewSession, new_status: str) -> KnlgInterviewSession:
        sess.status = new_status
        if new_status == "completed":
            sess.ended_at = datetime.now(UTC)
        self.session.flush()
        return sess

    def update_last_event(self, sess: KnlgInterviewSession, last_event_id: str) -> KnlgInterviewSession:
        sess.last_event_id = last_event_id
        self.session.flush()
        return sess

    def update_summary(self, sess: KnlgInterviewSession, summary: str) -> KnlgInterviewSession:
        sess.summary = summary
        self.session.flush()
        return sess

    def increment_turn_index(self, sess: KnlgInterviewSession) -> KnlgInterviewSession:
        sess.current_turn_index = (sess.current_turn_index or 0) + 1
        self.session.flush()
        return sess

    def list_ai(
        self, workspace_id: int, page: int = 1, page_size: int = 20, status: str | None = None
    ) -> tuple[list[KnlgInterviewSession], int]:
        q = self.session.query(KnlgInterviewSession).filter(
            KnlgInterviewSession.workspace_id == workspace_id,
            KnlgInterviewSession.mode == "ai_agent",
        )
        if status:
            q = q.filter(KnlgInterviewSession.status == status)
        q = q.order_by(KnlgInterviewSession.updated_at.desc())
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total


class AiTurnRepository:
    """CRUD for AI interview turns."""

    def __init__(self, session: Session):
        self.session = session

    def create(
        self,
        *,
        session_id: int,
        turn_index: int,
        user_question_text: str,
        workspace_id: int,
        user_question_id: int | None = None,
        expert_answer_text: str | None = None,
        ai_response_text: str | None = None,
        next_question_reason: str | None = None,
        prompt_id: int | None = None,
        prompt_version: str | None = None,
        model_id: int | None = None,
        tokens_used: int = 0,
        cost_usd: float = 0.0,
        duration_ms: int = 0,
        ttft_ms: int | None = None,
        llm_request_log: dict | None = None,
        started_at: datetime | None = None,
    ) -> KnlgInterviewAiTurn:
        turn = KnlgInterviewAiTurn(
            session_id=session_id,
            turn_index=turn_index,
            user_question_text=user_question_text,
            user_question_id=user_question_id,
            expert_answer_text=expert_answer_text,
            ai_response_text=ai_response_text,
            ai_response_streaming=False,
            next_question_reason=next_question_reason,
            prompt_id=prompt_id,
            prompt_version=prompt_version,
            model_id=model_id,
            tokens_used=tokens_used,
            cost_usd=cost_usd,
            duration_ms=duration_ms,
            ttft_ms=ttft_ms,
            llm_request_log=llm_request_log,
            started_at=started_at or datetime.now(UTC),
            completed_at=datetime.now(UTC) if expert_answer_text else None,
            workspace_id=workspace_id,
        )
        self.session.add(turn)
        self.session.flush()
        return turn

    def update_expert_answer(self, turn: KnlgInterviewAiTurn, expert_answer: str) -> KnlgInterviewAiTurn:
        turn.expert_answer_text = expert_answer
        self.session.flush()
        return turn

    def update_ai_response(self, turn: KnlgInterviewAiTurn, ai_response: str) -> KnlgInterviewAiTurn:
        turn.ai_response_text = ai_response
        turn.ai_response_streaming = False
        turn.completed_at = datetime.now(UTC)
        self.session.flush()
        return turn

    def list_by_session(self, session_id: int) -> list[KnlgInterviewAiTurn]:
        return (
            self.session.query(KnlgInterviewAiTurn)
            .filter(KnlgInterviewAiTurn.session_id == session_id)
            .order_by(KnlgInterviewAiTurn.turn_index.asc())
            .all()
        )


class SignalRepository:
    """CRUD for extracted signals."""

    def __init__(self, session: Session):
        self.session = session

    def create(
        self,
        *,
        session_id: int,
        source_turn_id: int,
        type: str,
        confidence: float,
        text: str,
        workspace_id: int,
        linked_question_id: int | None = None,
        metadata: dict | None = None,
    ) -> KnlgSignal:
        sig = KnlgSignal(
            session_id=session_id,
            source_turn_id=source_turn_id,
            type=type,
            confidence=confidence,
            text=text,
            linked_question_id=linked_question_id,
            meta_data=metadata or {},
            workspace_id=workspace_id,
        )
        self.session.add(sig)
        self.session.flush()
        return sig

    def list_by_session(self, session_id: int) -> list[KnlgSignal]:
        return (
            self.session.query(KnlgSignal)
            .filter(KnlgSignal.session_id == session_id)
            .order_by(KnlgSignal.created_at.asc())
            .all()
        )

    def count_by_type(self, session_id: int) -> dict[str, int]:
        from sqlalchemy import func

        rows = (
            self.session.query(KnlgSignal.type, func.count(KnlgSignal.id))
            .filter(KnlgSignal.session_id == session_id)
            .group_by(KnlgSignal.type)
            .all()
        )
        return {t: c for t, c in rows}


class PromptSnapshotRepository:
    """CRUD for prompt version snapshots."""

    def __init__(self, session: Session):
        self.session = session

    def create(
        self,
        *,
        prompt_id: int,
        prompt_version: str,
        rendered_text: str,
        variables_json: dict,
        workspace_id: int,
    ) -> KnlgPromptVersionSnapshot:
        snap = KnlgPromptVersionSnapshot(
            prompt_id=prompt_id,
            prompt_version=prompt_version,
            rendered_text=rendered_text,
            variables_json=variables_json,
            workspace_id=workspace_id,
        )
        self.session.add(snap)
        self.session.flush()
        return snap
