"""Employee Secondary Unit model definition."""

from datetime import datetime

from sqlalchemy import Integer, Column, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class EmployeeSecondaryUnit(Base):
    """Employee Secondary Unit model.

    Represents auxiliary organization units an employee belongs to.
    An employee can belong to multiple auxiliary units in addition to their primary unit.

    Attributes:
        id: Primary key
        employee_id: Employee ID
        unit_id: Organization unit ID
        created_at: Creation timestamp
    """

    __tablename__ = "employee_secondary_unit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(
        Integer,
        ForeignKey("employee.id", ondelete="CASCADE"),
        nullable=False,
    )
    unit_id = Column(
        Integer,
        ForeignKey("organization_unit.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="secondary_units")
    unit = relationship("OrganizationUnit")

    __table_args__ = (
        UniqueConstraint("employee_id", "unit_id", name="uq_employee_unit"),
        Index("idx_secondary_employee", "employee_id"),
        Index("idx_secondary_unit", "unit_id"),
    )

    def __repr__(self) -> str:
        return f"<EmployeeSecondaryUnit(employee_id={self.employee_id}, unit_id={self.unit_id})>"
