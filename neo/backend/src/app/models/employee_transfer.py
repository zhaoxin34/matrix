"""Employee Transfer model definition."""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import BigInteger, Column, Date, DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.orm import relationship

from app.database import Base


class TransferType(str, PyEnum):
    """Employee transfer type."""

    PROMOTION = "promotion"  # 晋升
    DEMOTION = "demotion"  # 降职
    TRANSFER = "transfer"  # 平调


class EmployeeTransfer(Base):
    """Employee Transfer model.

    Records employee transfer history between organization units.

    Attributes:
        id: Primary key
        employee_id: Employee ID
        from_unit_id: Original organization unit ID
        to_unit_id: New organization unit ID
        transfer_type: Type of transfer (promotion/demotion/transfer)
        effective_date: Date when transfer takes effect
        reason: Reason for transfer
        created_at: Creation timestamp
    """

    __tablename__ = "employee_transfer"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    employee_id = Column(
        BigInteger,
        ForeignKey("employee.id", ondelete="CASCADE"),
        nullable=False,
    )
    from_unit_id = Column(
        BigInteger,
        ForeignKey("organization_unit.id", ondelete="SET NULL"),
        nullable=True,
    )
    to_unit_id = Column(
        BigInteger,
        ForeignKey("organization_unit.id", ondelete="RESTRICT"),
        nullable=False,
    )
    transfer_type = Column(Enum(TransferType), nullable=False)
    effective_date = Column(Date, nullable=False)
    reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="transfers")
    from_unit = relationship("OrganizationUnit", foreign_keys=[from_unit_id])
    to_unit = relationship("OrganizationUnit", foreign_keys=[to_unit_id])

    __table_args__ = (
        Index("idx_transfer_employee", "employee_id"),
        Index("idx_transfer_effective_date", "effective_date"),
    )

    def __repr__(self) -> str:
        return f"<EmployeeTransfer(id={self.id}, employee_id={self.employee_id}, type={self.transfer_type})>"
