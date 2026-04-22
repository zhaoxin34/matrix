"""EmployeeSecondaryUnit model."""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EmployeeSecondaryUnit(Base):
    """Employee secondary (additional) unit membership."""

    __tablename__ = "employee_secondary_unit"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("employee.id", ondelete="CASCADE"), nullable=False)
    unit_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("organization_unit.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("employee_id", "unit_id", name="uq_employee_secondary_unit"),)

    # Relationships
    employee: Mapped["Employee"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Employee", back_populates="secondary_units"
    )
    unit: Mapped["OrganizationUnit"] = relationship("OrganizationUnit")  # type: ignore[name-defined]  # noqa: F821
