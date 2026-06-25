"""EmbeddedSite model definition."""

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
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class EmbeddedSiteStatus(PyEnum):
    """Embedded site status enum."""

    ENABLED = "ENABLED"
    DISABLED = "DISABLED"


class EmbeddedSite(Base):
    """EmbeddedSite model.

    EmbeddedSite represents a website that can be embedded and learned
    by Agents for automated operations.

    Attributes:
        id: Primary key (bigint for scalability)
        site_name: Display name of the website
        site_url: URL of the website
        description: Optional description
        workspace_id: Associated workspace ID
        status: Status (enabled/disabled)
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
        deleted_at: Soft delete timestamp (NULL if not deleted)
    """

    __tablename__ = "embedded_sites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    site_name = Column(String(255), nullable=False)
    site_url = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        Enum(EmbeddedSiteStatus),
        nullable=False,
        default=EmbeddedSiteStatus.DISABLED,
    )
    created_by = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="embedded_sites")
    events = relationship("Event", back_populates="embedded_site")
    statuses = relationship("Status", back_populates="embedded_site")

    __table_args__ = (
        Index("idx_es_site_name", "site_name"),
        Index("idx_es_status", "status"),
        Index("uk_es_workspace_name", "workspace_id", "site_name", unique=True),
    )

    def __repr__(self) -> str:
        return f"<EmbeddedSite(id={self.id}, site_name={self.site_name}, status={self.status})>"
