"""knlg_interview_turn_ref model: References between Q&A turns."""

from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgInterviewTurnRef(Base):
    """Reference relationship between two Q&A turns.

    Models how turns reference each other: support, counter_example,
    refine, derived_from, replaced_by.

    Attributes:
        id: Primary key
        source_turn_id: Source turn (origin of reference)
        target_turn_id: Target turn (referenced)
        relation: support / counter_example / refine / derived_from / replaced_by
        note: Optional human-readable note
        created_by: User who created the reference
        created_at: Creation timestamp
    """

    __tablename__ = "knlg_interview_turn_ref"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_turn_id = Column(
        Integer,
        ForeignKey("knlg_interview_turn.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_turn_id = Column(
        Integer,
        ForeignKey("knlg_interview_turn.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relation = Column(String(32), nullable=False)
    note = Column(Text, nullable=True)
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    source_turn = relationship("KnlgInterviewTurn", foreign_keys=[source_turn_id])
    target_turn = relationship("KnlgInterviewTurn", foreign_keys=[target_turn_id])
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        UniqueConstraint(
            "source_turn_id",
            "target_turn_id",
            "relation",
            name="uk_turn_ref_source_target",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<KnlgInterviewTurnRef(id={self.id}, source={self.source_turn_id}, "
            f"target={self.target_turn_id}, relation={self.relation})>"
        )
