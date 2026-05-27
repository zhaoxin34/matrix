"""Organization Unit model definition."""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class OrgUnitType(str, PyEnum):
    """Organization unit types."""

    COMPANY = "company"
    BRANCH = "branch"
    DEPARTMENT = "department"
    SUB_DEPARTMENT = "sub_department"


class OrgUnitStatus(str, PyEnum):
    """Organization unit status."""

    ACTIVE = "active"
    INACTIVE = "inactive"


class OrganizationUnit(Base):
    """Organization Unit model.

    Represents a node in the organization hierarchy tree.

    Attributes:
        id: Primary key
        name: Organization name (1-100 characters)
        code: Unique organization code
        type: Organization type (company/branch/department/sub_department)
        parent_id: Parent organization ID (null for root)
        level: Hierarchy depth (0-based)
        sort_order: Sort order (lower value = higher priority)
        leader_id: Leader user ID (FK to users.id)
        status: Active or inactive status
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "organization_unit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    type = Column(
        Enum(OrgUnitType),
        nullable=False,
        default=OrgUnitType.DEPARTMENT,
    )
    parent_id = Column(
        BigInteger,
        ForeignKey("organization_unit.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    level = Column(Integer, nullable=False, default=0)
    sort_order = Column(Integer, nullable=False, default=0)
    leader_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    status = Column(
        Enum(OrgUnitStatus),
        nullable=False,
        default=OrgUnitStatus.ACTIVE,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    parent = relationship(
        "OrganizationUnit",
        remote_side=[id],
        back_populates="children",
    )
    children = relationship(
        "OrganizationUnit",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    leader = relationship("User", foreign_keys=[leader_id])

    __table_args__ = (
        Index("idx_org_unit_parent_level", "parent_id", "level"),
        Index("idx_org_unit_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<OrganizationUnit(id={self.id}, name={self.name}, type={self.type})>"
