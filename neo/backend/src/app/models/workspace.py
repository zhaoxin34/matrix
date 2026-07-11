"""Workspace model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
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


class WorkspaceStatus(str, PyEnum):
    """Workspace status enum."""

    ACTIVE = "active"
    DISABLED = "disabled"


class Workspace(Base):
    """Workspace model.

    Workspace is a resource isolation boundary belonging to an organization.

    Attributes:
        id: Primary key
        name: Workspace name (1-50 characters)
        code: URL-friendly identifier (unique)
        description: Description (0-500 characters)
        status: Active or disabled
        org_id: Organization ID (FK)
        owner_id: Owner user ID (FK)
        settings: Workspace-level configuration (JSON)
        created_at: Creation timestamp
        updated_at: Last update timestamp
        disabled_at: Disabled timestamp
        disabled_by: User who disabled the workspace
    """

    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    status = Column(
        Enum(WorkspaceStatus),
        nullable=False,
        default=WorkspaceStatus.ACTIVE,
    )
    org_id = Column(
        Integer,
        ForeignKey("organization_unit.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    settings = Column(String(5000), nullable=True)  # JSON stored as string
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
    disabled_at = Column(DateTime, nullable=True)
    disabled_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    organization = relationship(
        "OrganizationUnit",
        foreign_keys=[org_id],
    )
    owner = relationship(
        "User",
        foreign_keys=[owner_id],
    )
    disabled_by_user = relationship(
        "User",
        foreign_keys=[disabled_by],
    )
    members = relationship(
        "WorkspaceMember",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    embedded_sites = relationship(
        "EmbeddedSite",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    tasks = relationship(
        "Task",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    events = relationship(
        "Event",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    statuses = relationship(
        "Status",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    interceptors = relationship(
        "Interceptor",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    request_logs = relationship(
        "RequestLog",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_workspace_org_status", "org_id", "status"),
        Index("idx_workspace_owner", "owner_id"),
    )

    def __repr__(self) -> str:
        return f"<Workspace(id={self.id}, name={self.name}, code={self.code})>"
