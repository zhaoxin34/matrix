"""RecordingSegmentComment service.

Encapsulates business logic for RecordingSegmentComment operations:
- CRUD (create / list / update / delete)
- Permission checks (creator OR Workspace Owner)
- Batch delete with per-item skip semantics
"""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.recording_segment_comment import RecordingSegmentComment
from app.models.workspace_member import MemberRole, WorkspaceMember
from app.schemas.recording_segment_comment import (
    RecordingSegmentCommentCreate,
    RecordingSegmentCommentUpdate,
)

logger = logging.getLogger(__name__)


# Errors raised by the service. Routes translate these into HTTPException.
class CommentNotFoundError(Exception):
    """Raised when the comment uid does not exist."""


class SegmentNotFoundError(Exception):
    """Raised when the segment uid does not exist."""


class PermissionDeniedError(Exception):
    """Raised when the current user is not allowed to perform the operation."""


class InvalidTimeRangeError(Exception):
    """Raised when hide_time <= show_time or show_time < 0."""


class RecordingSegmentCommentService:
    """Service for RecordingSegmentComment operations."""

    def __init__(self, db: Session):
        self.db = db

    # ===== Permission helpers =====

    def _is_workspace_owner(self, user_id: int, workspace_id: int) -> bool:
        """Return True if the user is a member with role OWNER."""
        member = (
            self.db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.role == MemberRole.OWNER,
            )
            .first()
        )
        return member is not None

    def _require_write_permission(self, workspace_id: int, user_id: int) -> None:
        """Check the user is at least an Admin of the workspace.

        Role semantics:
            OWNER / ADMIN: can create comments
            MEMBER  / GUEST: cannot create comments
        """
        member = (
            self.db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
            .first()
        )
        if member is None or member.role not in (MemberRole.ADMIN, MemberRole.OWNER):
            raise PermissionDeniedError("Admin or Owner role required")

    def _require_comment_owner_or_workspace_owner(self, comment: RecordingSegmentComment, user_id: int) -> None:
        """For update/delete: only comment creator OR workspace Owner may proceed."""
        if comment.creator_id == user_id:
            return
        if self._is_workspace_owner(user_id, comment.recording.workspace_id):
            return
        raise PermissionDeniedError("Only the comment creator or a workspace Owner may modify this comment")

    # ===== CRUD =====

    def create_comment(
        self,
        recording_uid: str,
        data: RecordingSegmentCommentCreate,
        user_id: int,
    ) -> RecordingSegmentComment:
        """Create a new comment.

        Raises:
            SegmentNotFoundError: when the segment uid does not exist under the recording.
            PermissionDeniedError: when the user lacks write permission on the workspace.
            InvalidTimeRangeError: when time range is invalid (already enforced by schema
                validators, but defended in depth here).
        """
        from app.models.recording import Recording
        from app.models.segment import Segment

        recording = self.db.query(Recording).filter(Recording.uid == recording_uid).first()
        if not recording:
            raise SegmentNotFoundError(f"Recording not found: {recording_uid}")

        segment = (
            self.db.query(Segment).filter(Segment.uid == data.segment_uid, Segment.recording_id == recording.id).first()
        )
        if not segment:
            raise SegmentNotFoundError(f"Segment {data.segment_uid} not found under recording {recording_uid}")

        self._require_write_permission(recording.workspace_id, user_id)

        if data.hide_time <= data.show_time or data.show_time < 0:
            raise InvalidTimeRangeError("hide_time must be > show_time and show_time must be >= 0")

        comment = RecordingSegmentComment(
            uid=str(uuid.uuid4()),
            recording_id=recording.id,
            segment_id=segment.id,
            show_time=data.show_time,
            hide_time=data.hide_time,
            abstract=data.abstract,
            content=data.content,
            creator_id=user_id,
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def update_comment(
        self,
        comment_uid: str,
        data: RecordingSegmentCommentUpdate,
        user_id: int,
    ) -> RecordingSegmentComment:
        """Update a comment. Permission: creator or workspace Owner only."""
        comment = self.db.query(RecordingSegmentComment).filter(RecordingSegmentComment.uid == comment_uid).first()
        if not comment:
            raise CommentNotFoundError(f"Comment not found: {comment_uid}")

        self._require_comment_owner_or_workspace_owner(comment, user_id)

        new_show = data.show_time if data.show_time is not None else comment.show_time
        new_hide = data.hide_time if data.hide_time is not None else comment.hide_time
        if new_hide <= new_show or new_show < 0:
            raise InvalidTimeRangeError("hide_time must be > show_time and show_time must be >= 0")

        if data.show_time is not None:
            comment.show_time = data.show_time
        if data.hide_time is not None:
            comment.hide_time = data.hide_time
        if data.abstract is not None:
            comment.abstract = data.abstract
        if data.content is not None:
            comment.content = data.content

        comment.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete_comment(self, comment_uid: str, user_id: int) -> None:
        """Delete a single comment. Permission: creator or workspace Owner only."""
        comment = self.db.query(RecordingSegmentComment).filter(RecordingSegmentComment.uid == comment_uid).first()
        if not comment:
            raise CommentNotFoundError(f"Comment not found: {comment_uid}")

        self._require_comment_owner_or_workspace_owner(comment, user_id)
        self.db.delete(comment)
        self.db.commit()

    def batch_delete_comments(self, recording_uid: str, comment_uids: list[str], user_id: int) -> tuple[int, list[str]]:
        """Delete multiple comments with per-item permission check.

        Returns:
            (deleted_count, skipped_uids)
        """
        from app.models.recording import Recording

        recording = self.db.query(Recording).filter(Recording.uid == recording_uid).first()
        if not recording:
            raise SegmentNotFoundError(f"Recording not found: {recording_uid}")

        skipped: list[str] = []
        deleted = 0
        for cmt_uid in comment_uids:
            comment = (
                self.db.query(RecordingSegmentComment)
                .filter(
                    RecordingSegmentComment.uid == cmt_uid,
                    RecordingSegmentComment.recording_id == recording.id,
                )
                .first()
            )
            if not comment:
                skipped.append(cmt_uid)
                continue
            try:
                self._require_comment_owner_or_workspace_owner(comment, user_id)
            except PermissionDeniedError:
                skipped.append(cmt_uid)
                continue
            self.db.delete(comment)
            deleted += 1

        self.db.commit()
        return deleted, skipped

    def get_comment(self, comment_uid: str) -> RecordingSegmentComment | None:
        """Fetch a comment by uid."""
        return self.db.query(RecordingSegmentComment).filter(RecordingSegmentComment.uid == comment_uid).first()

    # ===== Queries =====

    def list_by_recording(
        self,
        recording_uid: str,
        segment_uid: str | None = None,
        creator_id: int | None = None,
        sort: str = "show_time",
        order: str = "asc",
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[RecordingSegmentComment], int]:
        """List comments of a recording with optional filters."""
        from app.models.recording import Recording

        recording = self.db.query(Recording).filter(Recording.uid == recording_uid).first()
        if not recording:
            return [], 0

        q = self.db.query(RecordingSegmentComment).filter(RecordingSegmentComment.recording_id == recording.id)

        if segment_uid:
            from app.models.segment import Segment

            seg = (
                self.db.query(Segment).filter(Segment.uid == segment_uid, Segment.recording_id == recording.id).first()
            )
            if not seg:
                return [], 0
            q = q.filter(RecordingSegmentComment.segment_id == seg.id)

        if creator_id is not None:
            q = q.filter(RecordingSegmentComment.creator_id == creator_id)

        total = q.count()

        sort_col = getattr(RecordingSegmentComment, sort, RecordingSegmentComment.show_time)
        if order == "desc":
            q = q.order_by(sort_col.desc())
        else:
            q = q.order_by(sort_col.asc())

        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def list_by_segment(self, segment_uid: str) -> list[RecordingSegmentComment]:
        """List all comments of a single segment, sorted by show_time ascending."""
        from app.models.segment import Segment

        seg = self.db.query(Segment).filter(Segment.uid == segment_uid).first()
        if not seg:
            return []
        return (
            self.db.query(RecordingSegmentComment)
            .filter(RecordingSegmentComment.segment_id == seg.id)
            .order_by(RecordingSegmentComment.show_time.asc())
            .all()
        )
