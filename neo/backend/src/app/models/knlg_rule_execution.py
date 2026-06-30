"""knlg_rule_execution model: Rule execution log (P3 owns this)."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgRuleExecution(Base):
    """Record of each rule trigger execution.

    Used for health monitoring and feedback loop. Created by P3
    (Trigger Engine). P0 only supports READ via API (P3 endpoint).

    Attributes:
        id: Primary key
        rule_id: Triggered rule
        entity_name: Entity the rule acted on
        event_id: Triggering event ID (nullable)
        triggered_at: When the rule was triggered
        evaluation_result: JSON evaluation result (conditions met/not)
        conclusion_executed: JSON conclusion that was executed
        user_action: 采纳/忽略/未操作 (accepted/ignored/no action)
        user_action_at: When user took action
        workspace_id: Owning workspace
        created_at: Creation timestamp
    """

    __tablename__ = "knlg_rule_execution"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_id = Column(
        Integer,
        ForeignKey("knlg_rule.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    entity_name = Column(String(255), nullable=False, index=True)
    event_id = Column(Integer, nullable=True)
    triggered_at = Column(DateTime, nullable=False, index=True)
    evaluation_result = Column(JSON, nullable=False)
    conclusion_executed = Column(JSON, nullable=True)
    user_action = Column(String(64), nullable=True)
    user_action_at = Column(DateTime, nullable=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    rule = relationship("KnlgRule", foreign_keys=[rule_id])

    def __repr__(self) -> str:
        return f"<KnlgRuleExecution(id={self.id}, rule_id={self.rule_id}, entity_name={self.entity_name})>"
