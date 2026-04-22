"""EmployeeTransfer model."""

import enum
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TransferType(str, enum.Enum):
    promotion = "promotion"
    demotion = "demotion"
    transfer = "transfer"


class EmployeeTransfer(Base):
    """Employee department transfer record."""

    __tablename__ = "employee_transfer"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("employee.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_unit_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("organization_unit.id"), nullable=True)
    to_unit_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("organization_unit.id"), nullable=False)
    transfer_type: Mapped[TransferType] = mapped_column(Enum(TransferType), nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    employee: Mapped["Employee"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Employee", back_populates="transfers", foreign_keys=[employee_id]
    )
    from_unit: Mapped["OrganizationUnit | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "OrganizationUnit", foreign_keys=[from_unit_id]
    )
    to_unit: Mapped["OrganizationUnit"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "OrganizationUnit", foreign_keys=[to_unit_id]
    )
