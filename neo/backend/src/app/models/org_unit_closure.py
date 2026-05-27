"""Organization Unit Closure model definition."""

from sqlalchemy import BigInteger, Column, ForeignKey, Index, Integer

from app.database import Base


class OrgUnitClosure(Base):
    """Organization Unit Closure model.

    Stores ancestor-descendant relationships for efficient hierarchy queries.
    Each row represents a path from an ancestor to a descendant with the depth
    between them.

    Attributes:
        ancestor_id: Ancestor organization unit ID
        descendant_id: Descendant organization unit ID
        depth: Depth difference between ancestor and descendant
    """

    __tablename__ = "org_unit_closure"

    ancestor_id = Column(
        BigInteger,
        ForeignKey("organization_unit.id", ondelete="CASCADE"),
        primary_key=True,
    )
    descendant_id = Column(
        BigInteger,
        ForeignKey("organization_unit.id", ondelete="CASCADE"),
        primary_key=True,
    )
    depth = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        Index("idx_closure_ancestor", "ancestor_id"),
        Index("idx_closure_descendant", "descendant_id"),
        Index("idx_closure_depth", "depth"),
    )

    def __repr__(self) -> str:
        return f"<OrgUnitClosure(ancestor={self.ancestor_id}, descendant={self.descendant_id}, depth={self.depth})>"
