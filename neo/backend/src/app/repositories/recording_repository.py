"""Recording repository."""

import json
from datetime import datetime
from typing import Optional, cast

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.recording import Recording, RecordingStatus
from app.models.segment import Segment


class RecordingRepository:
    """Repository for Recording operations."""

    def __init__(self, db: Session):
        """Initialize repository."""
        self.db = db

    def get_by_uid(self, uid: str) -> Optional[Recording]:
        """Get recording by UID."""
        return self.db.query(Recording).filter(Recording.uid == uid).first()

    def get_by_uids(self, uids: list[str]) -> list[Recording]:
        """Get recordings by a list of UIDs."""
        if not uids:
            return []
        return self.db.query(Recording).filter(Recording.uid.in_(uids)).all()

    def get_by_workspace(
        self,
        workspace_id: int,
        search: Optional[str] = None,
        tags: Optional[list[str]] = None,
        status: Optional[RecordingStatus] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        sort: str = "created_at",
        order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Recording], int]:
        """Get recordings by workspace with filters and pagination."""
        query = self.db.query(Recording).filter(Recording.workspace_id == workspace_id)

        # Search by name
        if search:
            query = query.filter(Recording.name.ilike(f"%{search}%"))

        # Filter by tags
        if tags:
            for tag in tags:
                query = query.filter(Recording.tags.ilike(f'%"{tag}"%'))

        # Filter by status
        if status:
            query = query.filter(Recording.status == status)

        # Filter by date range
        if from_date:
            query = query.filter(Recording.created_at >= from_date)
        if to_date:
            query = query.filter(Recording.created_at <= to_date)

        # Get total count
        total = query.count()

        # Sort
        sort_column = getattr(Recording, sort, Recording.created_at)
        if order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Paginate
        recordings = query.offset((page - 1) * page_size).limit(page_size).all()

        return recordings, total

    def create(self, recording: Recording) -> Recording:
        """Create a new recording."""
        self.db.add(recording)
        self.db.commit()
        self.db.refresh(recording)
        return recording

    def update(self, recording: Recording) -> Recording:
        """Update an existing recording."""
        self.db.commit()
        self.db.refresh(recording)
        return recording

    def delete(self, recording: Recording) -> None:
        """Delete a recording."""
        self.db.delete(recording)
        self.db.commit()

    def delete_batch(self, uids: list[str]) -> int:
        """Delete multiple recordings by UID."""
        count = self.db.query(Recording).filter(Recording.uid.in_(uids)).delete(synchronize_session=False)
        self.db.commit()
        return count

    def update_tags_batch(self, uids: list[str], action: str, tags: list[str]) -> int:
        """Update tags for multiple recordings."""
        recordings = self.db.query(Recording).filter(Recording.uid.in_(uids)).all()
        count = 0

        for recording in recordings:
            raw_tags = cast(str, getattr(recording, "tags", "") or "[]")
            current_tags = json.loads(raw_tags)
            if action == "add":
                for tag in tags:
                    if tag not in current_tags:
                        current_tags.append(tag)
            elif action == "remove":
                current_tags = [t for t in current_tags if t not in tags]
            setattr(recording, "tags", json.dumps(current_tags))
            count += 1

        self.db.commit()
        return count


class SegmentRepository:
    """Repository for Segment operations."""

    def __init__(self, db: Session):
        """Initialize repository."""
        self.db = db

    def get_by_uid(self, uid: str) -> Optional[Segment]:
        """Get segment by UID."""
        return self.db.query(Segment).filter(Segment.uid == uid).first()

    def get_by_recording(self, recording_id: int) -> list[Segment]:
        """Get all segments for a recording."""
        return self.db.query(Segment).filter(Segment.recording_id == recording_id).order_by(Segment.sequence).all()

    def get_next_sequence(self, recording_id: int) -> int:
        """Get the next sequence number for a recording."""
        max_seq = self.db.query(func.max(Segment.sequence)).filter(Segment.recording_id == recording_id).scalar()
        return (max_seq or 0) + 1

    def create(self, segment: Segment) -> Segment:
        """Create a new segment."""
        self.db.add(segment)
        self.db.commit()
        self.db.refresh(segment)
        return segment

    def get_storage_keys(self, recording_id: int) -> list[str]:
        """Get all storage keys for a recording."""
        segments = self.get_by_recording(recording_id)
        return [str(s.storage_key) for s in segments]
