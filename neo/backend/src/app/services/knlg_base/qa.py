"""QA library services: QuestionTree, Question, InterviewSession, Interview, Turn, TurnRef."""

from typing import Any

from sqlalchemy.orm import Session

from app.core.error_codes import ERR_CONFLICT, ERR_INVALID_PARAMETER, ERR_NOT_FOUND
from app.core.exceptions import BusinessException
from app.models.user import User
from app.repositories.knlg_base.qa import (
    KnlgInterviewRepository,
    KnlgInterviewSessionRepository,
    KnlgInterviewTurnRefRepository,
    KnlgInterviewTurnRepository,
    KnlgQuestionRepository,
    KnlgQuestionTreeRepository,
)
from app.services.knlg_base.base import KnlgBaseService

# ==================== Question Tree ====================


class KnlgQuestionTreeService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgQuestionTreeRepository(db)
        self.question_repo = KnlgQuestionRepository(db)

    def list_trees(self, workspace_code: str, user: User, page=1, page_size=20, domain=None, is_active=None):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.repo.list(ws_id, page, page_size, domain, is_active)

    def get_tree(self, workspace_code: str, user: User, tree_id: int):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        tree = self.repo.get_by_id(ws_id, tree_id)
        if not tree:
            raise BusinessException(ERR_NOT_FOUND, "Question tree not found")
        return tree

    def create_tree(self, workspace_code: str, user: User, data: dict[str, Any]):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        data.setdefault("workspace_id", ws_id)
        data.setdefault("created_by", user.id)
        data.setdefault("version", "1.0")
        data.setdefault("is_active", True)
        return self.repo.create(data)

    def update_tree(self, workspace_code: str, user: User, tree_id: int, data: dict[str, Any]):
        """Update creates a new version (deactivate old, insert new with bumped version)."""
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        old = self.repo.get_by_id(ws_id, tree_id)
        if not old:
            raise BusinessException(ERR_NOT_FOUND, "Question tree not found")

        # Mark old as inactive
        old.is_active = False

        # Create new version
        new_data = {
            "workspace_id": ws_id,
            "created_by": user.id,
            "name": data.get("name", old.name),
            "domain": data.get("domain", old.domain),
            "description": data.get("description", old.description),
            "questions": data.get("questions", old.questions),
            "version": self._bump_version(old.version),
            "is_active": True,
        }
        return self.repo.create(new_data)

    def delete_tree(self, workspace_code: str, user: User, tree_id: int) -> None:
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        tree = self.repo.get_by_id(ws_id, tree_id)
        if not tree:
            raise BusinessException(ERR_NOT_FOUND, "Question tree not found")
        if self.repo.has_questions_using_tree(tree_id):
            raise BusinessException(
                ERR_CONFLICT,
                "Cannot delete: questions reference this tree",
            )
        self.repo.delete(tree)

    @staticmethod
    def _bump_version(version: str) -> str:
        """Bump semantic version (e.g., 1.0 -> 1.1)."""
        try:
            major, minor = version.split(".")
            return f"{major}.{int(minor) + 1}"
        except (ValueError, AttributeError):
            return "1.0"


# ==================== Question ====================


class KnlgQuestionService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgQuestionRepository(db)

    def list_questions(
        self,
        workspace_code,
        user,
        page=1,
        page_size=20,
        domain=None,
        status=None,
        tags=None,
        keyword=None,
        tree_id=None,
    ):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        items, total = self.repo.list(
            ws_id,
            page,
            page_size,
            domain=domain,
            status=status,
            tags=tags,
            keyword=keyword,
            tree_id=tree_id,
        )
        # Attach interview_count
        for item in items:
            item.interview_count = self.repo.count_interviews_by_question(item.id)
        return items, total

    def get_question(self, workspace_code, user, question_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        q = self.repo.get_by_id(ws_id, question_id)
        if not q:
            raise BusinessException(ERR_NOT_FOUND, "Question not found")
        q.interview_count = self.repo.count_interviews_by_question(q.id)
        return q

    def create_question(self, workspace_code, user, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        data.setdefault("workspace_id", ws_id)
        data.setdefault("created_by", user.id)
        data.setdefault("status", "pending")
        return self.repo.create(data)

    def update_question(self, workspace_code, user, question_id, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        q = self.repo.get_by_id(ws_id, question_id)
        if not q:
            raise BusinessException(ERR_NOT_FOUND, "Question not found")
        return self.repo.update(q, data)

    def archive_question(self, workspace_code, user, question_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        q = self.repo.get_by_id(ws_id, question_id)
        if not q:
            raise BusinessException(ERR_NOT_FOUND, "Question not found")
        return self.repo.archive(q)


# ==================== Interview Session ====================


class KnlgInterviewSessionService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgInterviewSessionRepository(db)

    def list_sessions(self, workspace_code, user, page=1, page_size=20, expert_id=None, mode=None):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.repo.list(ws_id, page, page_size, expert_id, mode)

    def get_session(self, workspace_code, user, session_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        s = self.repo.get_by_id(ws_id, session_id)
        if not s:
            raise BusinessException(ERR_NOT_FOUND, "Interview session not found")
        s.interviews = self.repo.list_interviews_in_session(ws_id, session_id)
        return s

    def create_session(self, workspace_code, user, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        if data.get("mode") == "ai_agent":
            raise BusinessException(
                ERR_INVALID_PARAMETER,
                "AI agent mode is not supported in P0",
            )
        data.setdefault("workspace_id", ws_id)
        from datetime import UTC, datetime

        data.setdefault("started_at", datetime.now(UTC))
        return self.repo.create(data)

    def update_session(self, workspace_code, user, session_id, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        s = self.repo.get_by_id(ws_id, session_id)
        if not s:
            raise BusinessException(ERR_NOT_FOUND, "Interview session not found")
        return self.repo.update(s, data)

    def end_session(self, workspace_code, user, session_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        s = self.repo.get_by_id(ws_id, session_id)
        if not s:
            raise BusinessException(ERR_NOT_FOUND, "Interview session not found")
        if s.ended_at is not None:
            raise BusinessException(ERR_CONFLICT, "Session already ended")
        return self.repo.end(s)


# ==================== Interview ====================


class KnlgInterviewService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgInterviewRepository(db)
        self.question_repo = KnlgQuestionRepository(db)
        self.turn_repo = KnlgInterviewTurnRepository(db)

    def list_interviews(
        self, workspace_code, user, page=1, page_size=20, session_id=None, question_id=None, expert_id=None, mode=None
    ):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.repo.list(ws_id, page, page_size, session_id, question_id, expert_id, mode)

    def get_interview(self, workspace_code, user, interview_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        i = self.repo.get_by_id(ws_id, interview_id)
        if not i:
            raise BusinessException(ERR_NOT_FOUND, "Interview not found")
        i.turns = self.turn_repo.list_by_interview(ws_id, interview_id)
        return i

    def create_interview(self, workspace_code, user, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        data.setdefault("workspace_id", ws_id)
        interview = self.repo.create(data)
        # Auto-transition question status pending → in_progress
        q = self.question_repo.get_by_id(ws_id, interview.question_id)
        if q and q.status == "pending":
            self.question_repo.transition_status(q, "in_progress")
        return interview

    def end_interview(self, workspace_code, user, interview_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        i = self.repo.get_by_id(ws_id, interview_id)
        if not i:
            raise BusinessException(ERR_NOT_FOUND, "Interview not found")
        i = self.repo.end(i)
        # Auto-transition question to 'answered'
        q = self.question_repo.get_by_id(ws_id, i.question_id)
        if q and q.status in ("pending", "in_progress"):
            self.question_repo.transition_status(q, "answered")
        return i


# ==================== Interview Turn ====================


class KnlgInterviewTurnService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgInterviewTurnRepository(db)
        self.interview_repo = KnlgInterviewRepository(db)

    def list_turns(self, workspace_code, user, interview_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.repo.list_by_interview(ws_id, interview_id)

    def add_turn(self, workspace_code, user, interview_id, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        interview = self.interview_repo.get_by_id(ws_id, interview_id)
        if not interview:
            raise BusinessException(ERR_NOT_FOUND, "Interview not found")
        # Auto-increment sequence
        next_seq = self.repo.get_max_sequence(interview_id) + 1
        data["interview_id"] = interview_id
        data["sequence"] = next_seq
        data.setdefault("workspace_id", ws_id)
        data.setdefault("expert_id", interview.expert_id)
        data.setdefault("type", "initial")
        # Map "metadata" → "metadata_"
        if "metadata" in data:
            data["metadata_"] = data.pop("metadata")
        return self.repo.create(data)

    def update_turn(self, workspace_code, user, interview_id, turn_id, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        turn = self.repo.get_by_id(ws_id, turn_id)
        if not turn or turn.interview_id != interview_id:
            raise BusinessException(ERR_NOT_FOUND, "Turn not found")
        return self.repo.update(turn, data)

    def delete_turn(self, workspace_code, user, interview_id, turn_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        turn = self.repo.get_by_id(ws_id, turn_id)
        if not turn or turn.interview_id != interview_id:
            raise BusinessException(ERR_NOT_FOUND, "Turn not found")
        self.repo.delete(turn)

    def reorder_turns(self, workspace_code, user, interview_id, items):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        self.repo.reorder(ws_id, interview_id, items)


# ==================== Turn Reference ====================


class KnlgInterviewTurnRefService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgInterviewTurnRefRepository(db)
        self.turn_repo = KnlgInterviewTurnRepository(db)

    def list_refs(self, workspace_code, user, turn_id, relation=None):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.repo.list_by_turn(ws_id, turn_id, relation)

    def create_ref(self, workspace_code, user, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        data["created_by"] = user.id
        # Validate both turns exist
        if not self.turn_repo.get_by_id(ws_id, data["source_turn_id"]):
            raise BusinessException(ERR_NOT_FOUND, "Source turn not found")
        if not self.turn_repo.get_by_id(ws_id, data["target_turn_id"]):
            raise BusinessException(ERR_NOT_FOUND, "Target turn not found")
        return self.repo.create(data)

    def delete_ref(self, workspace_code, user, ref_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        ref = self.repo.get_by_id(ref_id)
        if not ref:
            raise BusinessException(ERR_NOT_FOUND, "Turn reference not found")
        self.repo.delete(ref)
