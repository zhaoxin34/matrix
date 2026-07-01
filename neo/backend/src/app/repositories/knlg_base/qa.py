"""QA library repositories: QuestionTree, Question, InterviewSession, Interview, Turn, TurnRef."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.knlg_interview import KnlgInterview
from app.models.knlg_interview_session import KnlgInterviewSession
from app.models.knlg_interview_turn import KnlgInterviewTurn
from app.models.knlg_interview_turn_ref import KnlgInterviewTurnRef
from app.models.knlg_question import KnlgQuestion
from app.models.knlg_question_tree import KnlgQuestionTree

# ==================== Question Tree ====================


class KnlgQuestionTreeRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, tree_id: int) -> KnlgQuestionTree | None:
        return (
            self.session.query(KnlgQuestionTree)
            .filter(
                KnlgQuestionTree.workspace_id == workspace_id,
                KnlgQuestionTree.id == tree_id,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> KnlgQuestionTree:
        tree = KnlgQuestionTree(**data)
        self.session.add(tree)
        self.session.flush()
        self.session.refresh(tree)
        return tree

    def update(self, tree: KnlgQuestionTree, data: dict[str, Any]) -> KnlgQuestionTree:
        # Creates new version via service layer; this just applies data
        for key, value in data.items():
            if value is not None:
                setattr(tree, key, value)
        self.session.flush()
        self.session.refresh(tree)
        return tree

    def delete(self, tree: KnlgQuestionTree) -> None:
        self.session.delete(tree)
        self.session.flush()

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        domain: str | None = None,
        is_active: bool | None = None,
    ) -> tuple[list[KnlgQuestionTree], int]:
        query = self.session.query(KnlgQuestionTree).filter(KnlgQuestionTree.workspace_id == workspace_id)
        if domain:
            query = query.filter(KnlgQuestionTree.domain == domain)
        if is_active is not None:
            query = query.filter(KnlgQuestionTree.is_active == is_active)
        query = query.order_by(KnlgQuestionTree.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total

    def has_questions_using_tree(self, tree_id: int) -> bool:
        return self.session.query(KnlgQuestion).filter(KnlgQuestion.tree_id == tree_id).first() is not None


# ==================== Question ====================


class KnlgQuestionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, question_id: int) -> KnlgQuestion | None:
        return (
            self.session.query(KnlgQuestion)
            .filter(
                KnlgQuestion.workspace_id == workspace_id,
                KnlgQuestion.id == question_id,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> KnlgQuestion:
        question = KnlgQuestion(**data)
        self.session.add(question)
        self.session.flush()
        self.session.refresh(question)
        return question

    def update(self, question: KnlgQuestion, data: dict[str, Any]) -> KnlgQuestion:
        mutable = {"text", "domain", "tags", "priority", "tree_id", "parent_question_id"}
        for key, value in data.items():
            if value is not None and key in mutable:
                setattr(question, key, value)
        self.session.flush()
        self.session.refresh(question)
        return question

    def archive(self, question: KnlgQuestion) -> KnlgQuestion:
        question.status = "archived"
        self.session.flush()
        self.session.refresh(question)
        return question

    def transition_status(self, question: KnlgQuestion, new_status: str) -> KnlgQuestion:
        question.status = new_status
        self.session.flush()
        self.session.refresh(question)
        return question

    def count_interviews_by_question(self, question_id: int) -> int:
        return self.session.query(KnlgInterview).filter(KnlgInterview.question_id == question_id).count()

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        domain: str | None = None,
        status: str | None = None,
        tags: list[str] | None = None,
        keyword: str | None = None,
        tree_id: int | None = None,
    ) -> tuple[list[KnlgQuestion], int]:
        query = self.session.query(KnlgQuestion).filter(KnlgQuestion.workspace_id == workspace_id)
        if domain:
            query = query.filter(KnlgQuestion.domain == domain)
        if status:
            query = query.filter(KnlgQuestion.status == status)
        if tree_id:
            query = query.filter(KnlgQuestion.tree_id == tree_id)
        if tags:
            # Match ALL specified tags (using JSON_CONTAINS for MySQL)
            for tag in tags:
                query = query.filter(KnlgQuestion.tags.contains(f'"{tag}"'))
        if keyword:
            like = f"%{keyword}%"
            query = query.filter(KnlgQuestion.text.ilike(like))
        query = query.order_by(KnlgQuestion.priority.desc(), KnlgQuestion.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total


# ==================== Interview Session ====================


class KnlgInterviewSessionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, session_id: int) -> KnlgInterviewSession | None:
        return (
            self.session.query(KnlgInterviewSession)
            .filter(
                KnlgInterviewSession.workspace_id == workspace_id,
                KnlgInterviewSession.id == session_id,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> KnlgInterviewSession:
        session = KnlgInterviewSession(**data)
        self.session.add(session)
        self.session.flush()
        self.session.refresh(session)
        return session

    def update(self, session: KnlgInterviewSession, data: dict[str, Any]) -> KnlgInterviewSession:
        mutable = {"topic"}
        if session.ended_at is None:
            mutable.add("mode")
        for key, value in data.items():
            if value is not None and key in mutable:
                setattr(session, key, value)
        self.session.flush()
        self.session.refresh(session)
        return session

    def end(self, session: KnlgInterviewSession) -> KnlgInterviewSession:
        from datetime import UTC, datetime

        session.ended_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(session)
        return session

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        expert_id: int | None = None,
        mode: str | None = None,
    ) -> tuple[list[KnlgInterviewSession], int]:
        query = self.session.query(KnlgInterviewSession).filter(KnlgInterviewSession.workspace_id == workspace_id)
        if expert_id:
            query = query.filter(KnlgInterviewSession.expert_id == expert_id)
        if mode:
            query = query.filter(KnlgInterviewSession.mode == mode)
        query = query.order_by(KnlgInterviewSession.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total

    def list_interviews_in_session(self, workspace_id: int, session_id: int) -> list[KnlgInterview]:
        return (
            self.session.query(KnlgInterview)
            .filter(
                KnlgInterview.workspace_id == workspace_id,
                KnlgInterview.session_id == session_id,
            )
            .order_by(KnlgInterview.created_at.asc())
            .all()
        )


# ==================== Interview ====================


class KnlgInterviewRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, interview_id: int) -> KnlgInterview | None:
        return (
            self.session.query(KnlgInterview)
            .filter(
                KnlgInterview.workspace_id == workspace_id,
                KnlgInterview.id == interview_id,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> KnlgInterview:
        from datetime import UTC, datetime

        if "started_at" not in data:
            data["started_at"] = datetime.now(UTC)
        interview = KnlgInterview(**data)
        self.session.add(interview)
        self.session.flush()
        self.session.refresh(interview)
        return interview

    def end(self, interview: KnlgInterview) -> KnlgInterview:
        from datetime import UTC, datetime

        interview.ended_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(interview)
        return interview

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        session_id: int | None = None,
        question_id: int | None = None,
        expert_id: int | None = None,
        mode: str | None = None,
    ) -> tuple[list[KnlgInterview], int]:
        query = self.session.query(KnlgInterview).filter(KnlgInterview.workspace_id == workspace_id)
        if session_id:
            query = query.filter(KnlgInterview.session_id == session_id)
        if question_id:
            query = query.filter(KnlgInterview.question_id == question_id)
        if expert_id:
            query = query.filter(KnlgInterview.expert_id == expert_id)
        if mode:
            query = query.filter(KnlgInterview.mode == mode)
        query = query.order_by(KnlgInterview.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total


# ==================== Interview Turn ====================


class KnlgInterviewTurnRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, turn_id: int) -> KnlgInterviewTurn | None:
        return (
            self.session.query(KnlgInterviewTurn)
            .filter(
                KnlgInterviewTurn.workspace_id == workspace_id,
                KnlgInterviewTurn.id == turn_id,
            )
            .first()
        )

    def get_max_sequence(self, interview_id: int) -> int:
        result = (
            self.session.query(KnlgInterviewTurn.sequence)
            .filter(KnlgInterviewTurn.interview_id == interview_id)
            .order_by(KnlgInterviewTurn.sequence.desc())
            .first()
        )
        return result[0] if result else 0

    def create(self, data: dict[str, Any]) -> KnlgInterviewTurn:
        turn = KnlgInterviewTurn(**data)
        self.session.add(turn)
        self.session.flush()
        self.session.refresh(turn)
        return turn

    def update(self, turn: KnlgInterviewTurn, data: dict[str, Any]) -> KnlgInterviewTurn:
        mutable = {"question", "answer", "type", "confidence", "tags", "meta_data"}
        for key, value in data.items():
            if value is not None and key in mutable:
                setattr(turn, key, value)
        self.session.flush()
        self.session.refresh(turn)
        return turn

    def delete(self, turn: KnlgInterviewTurn) -> None:
        self.session.delete(turn)
        self.session.flush()

    def list_by_interview(self, workspace_id: int, interview_id: int) -> list[KnlgInterviewTurn]:
        return (
            self.session.query(KnlgInterviewTurn)
            .filter(
                KnlgInterviewTurn.workspace_id == workspace_id,
                KnlgInterviewTurn.interview_id == interview_id,
            )
            .order_by(KnlgInterviewTurn.sequence.asc())
            .all()
        )

    def reorder(self, workspace_id: int, interview_id: int, items: list[dict]) -> None:
        """Reorder turns atomically."""
        for item in items:
            turn = self.get_by_id(workspace_id, item["turn_id"])
            if turn and turn.interview_id == interview_id:
                turn.sequence = item["sequence"]
        self.session.flush()


# ==================== Turn Reference ====================


class KnlgInterviewTurnRefRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, ref_id: int) -> KnlgInterviewTurnRef | None:
        return self.session.query(KnlgInterviewTurnRef).filter(KnlgInterviewTurnRef.id == ref_id).first()

    def create(self, data: dict[str, Any]) -> KnlgInterviewTurnRef:
        ref = KnlgInterviewTurnRef(**data)
        self.session.add(ref)
        self.session.flush()
        self.session.refresh(ref)
        return ref

    def delete(self, ref: KnlgInterviewTurnRef) -> None:
        self.session.delete(ref)
        self.session.flush()

    def list_by_turn(self, workspace_id: int, turn_id: int, relation: str | None = None) -> list[KnlgInterviewTurnRef]:

        query = self.session.query(KnlgInterviewTurnRef).filter(
            KnlgInterviewTurnRef.source_turn_id == turn_id
            if False
            else (KnlgInterviewTurnRef.source_turn_id == turn_id) | (KnlgInterviewTurnRef.target_turn_id == turn_id)
        )
        if relation:
            query = query.filter(KnlgInterviewTurnRef.relation == relation)
        return query.order_by(KnlgInterviewTurnRef.created_at.desc()).all()
