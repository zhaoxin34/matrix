"""knlg_evidence model: Evidence for rule validation (READ-ONLY in P0)."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgEvidence(Base):
    """Evidence for rule validation.

    Created by P3 (Trigger Engine) or imported from external sources.
    P0 only supports READ via API.

    Attributes:
        id: Primary key
        rule_id: Associated rule
        case_source: opportunity / ticket / event
        case_id: Case ID (from opportunity / ticket / event tables)
        case_data: JSON snapshot of case data
        outcome: Actual outcome (free text or enum)
        matched_rule: Whether the rule's prediction matched actual outcome
        support_score: -1 to 1, support score for the rule
        validated_at: When this evidence was validated
        validator_type: historical_backtest / expert_judgement / live_outcome
        workspace_id: Owning workspace
        created_at: Creation timestamp
    """

    __tablename__ = "knlg_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_id = Column(
        Integer,
        ForeignKey("knlg_rule.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    case_source = Column(String(64), nullable=False)
    case_id = Column(Integer, nullable=False)
    case_data = Column(JSON, nullable=True)
    outcome = Column(String(64), nullable=True)
    matched_rule = Column(Boolean, nullable=False)
    support_score = Column(Float, nullable=False)
    validated_at = Column(DateTime, nullable=False)
    validator_type = Column(String(32), nullable=False)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    rule = relationship("KnlgRule", foreign_keys=[rule_id])

    __table_args__ = (
        Index("idx_ev_case", "case_source", "case_id"),
        Index("idx_ev_validator", "validator_type"),
    )

    def __repr__(self) -> str:
        return (
            f"<KnlgEvidence(id={self.id}, rule_id={self.rule_id}, "
            f"case_source={self.case_source}, matched_rule={self.matched_rule})>"
        )
