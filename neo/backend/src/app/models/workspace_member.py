"""WorkspaceMember model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class MemberRole(str, PyEnum):
    """Workspace member role enum."""

    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    GUEST = "guest"


class WorkspaceMember(Base):
    """Workspace member model.

    Represents the membership relationship between a user and a workspace.

    Attributes:
        id: Primary key
        workspace_id: Workspace ID (FK)
        user_id: User ID (FK)
        role: Member role (owner/admin/member/guest)
        created_at: Join timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(
        Enum(MemberRole),
        nullable=False,
        default=MemberRole.MEMBER,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uk_workspace_user"),
        Index("idx_workspace_member_user", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<WorkspaceMember(workspace_id={self.workspace_id}, user_id={self.user_id}, role={self.role})>"
