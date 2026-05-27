"""User Employee Mapping model definition."""

from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Index, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class UserEmployeeMapping(Base):
    """User Employee Mapping model.

    Maps users to employees (1:0..1 relationship).
    A user can optionally be linked to an employee record.

    Attributes:
        id: Primary key
        user_id: User ID (unique)
        employee_id: Employee ID (unique)
        created_at: Creation timestamp
    """

    __tablename__ = "user_employee_mapping"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    employee_id = Column(
        BigInteger,
        ForeignKey("employee.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")
    employee = relationship("Employee")

    __table_args__ = (
        Index("idx_mapping_user", "user_id"),
        Index("idx_mapping_employee", "employee_id"),
    )

    def __repr__(self) -> str:
        return f"<UserEmployeeMapping(user_id={self.user_id}, employee_id={self.employee_id})>"
