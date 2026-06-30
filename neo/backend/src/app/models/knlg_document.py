"""knlg_document model: Source documents for knowledge import."""

from datetime import UTC, datetime

from sqlalchemy import JSON, BigInteger, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgDocument(Base):
    """Source document for knowledge import.

    Stores document metadata and file path (RustFS). Content parsing
    is NOT done in P0 - belongs to P2 (Document Parser).

    Attributes:
        id: Primary key
        name: Document name
        type: wiki / confluence / pdf / docx / md / csv / email / meeting_notes
        source_url: Optional URL (for wiki/confluence sources)
        file_path: File path in RustFS storage
        file_size: File size in bytes
        hash: SHA-256 content hash for duplicate detection
        metadata: JSON metadata (author, version, last modified, etc.)
        workspace_id: Owning workspace
        imported_by: User who imported the document
        imported_at: Import timestamp
    """

    __tablename__ = "knlg_document"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type = Column(String(32), nullable=False, index=True)
    source_url = Column(String(1024), nullable=True)
    file_path = Column(String(1024), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    hash = Column(String(64), nullable=True, index=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    imported_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    imported_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    importer = relationship("User", foreign_keys=[imported_by])

    def __repr__(self) -> str:
        return f"<KnlgDocument(id={self.id}, name={self.name}, type={self.type}, workspace_id={self.workspace_id})>"
