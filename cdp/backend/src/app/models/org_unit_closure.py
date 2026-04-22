"""OrgUnitClosure model (Closure Table for hierarchy)."""

from sqlalchemy import BigInteger, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OrgUnitClosure(Base):
    """Closure table for organization unit hierarchy."""

    __tablename__ = "org_unit_closure"

    ancestor_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("organization_unit.id", ondelete="CASCADE"), primary_key=True
    )
    descendant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("organization_unit.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    depth: Mapped[int] = mapped_column(Integer, nullable=False)
