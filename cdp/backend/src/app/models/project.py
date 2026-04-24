"""Project database model."""

import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    archived = "archived"


class ProjectMemberRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class Project(Base):
    """Project model."""

    __tablename__ = "project"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members: Mapped[list["ProjectMember"]] = relationship(
        "ProjectMember", back_populates="project", cascade="all, delete-orphan"
    )
    org_associations: Mapped[list["OrgProject"]] = relationship(
        "OrgProject", back_populates="project", cascade="all, delete-orphan"
    )


class ProjectMember(Base):
    """Project member model."""

    __tablename__ = "project_member"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("project.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    role: Mapped[ProjectMemberRole] = mapped_column(
        Enum(ProjectMemberRole), nullable=False, default=ProjectMemberRole.member
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="members")  # type: ignore[name-defined]  # noqa: F821
    user: Mapped["User"] = relationship("User", back_populates="project_memberships")  # type: ignore[name-defined]  # noqa: F821


class OrgProject(Base):
    """Organization-Project association model."""

    __tablename__ = "org_project"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    org_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("organization_unit.id"), nullable=False, index=True)
    project_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("project.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="org_associations")  # type: ignore[name-defined]  # noqa: F821
    organization: Mapped["OrganizationUnit"] = relationship("OrganizationUnit")  # type: ignore[name-defined]  # noqa: F821
