"""Address repository."""

from sqlalchemy.orm import Session

from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate


class AddressRepository:
    """Address repository for database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_id(self, address_id: int) -> Address | None:
        """Get address by ID."""
        return self.db.query(Address).filter(Address.id == address_id).first()

    def get_by_user(self, user_id: int) -> list[Address]:
        """Get all addresses for a user."""
        return self.db.query(Address).filter(Address.user_id == user_id).all()

    def get_default(self, user_id: int) -> Address | None:
        """Get default address for a user."""
        return self.db.query(Address).filter(Address.user_id == user_id, Address.is_default).first()

    def create(self, user_id: int, address_data: AddressCreate) -> Address:
        """Create a new address."""
        address = Address(
            user_id=user_id,
            recipient_name=address_data.recipient_name,
            phone=address_data.phone,
            province=address_data.province,
            city=address_data.city,
            district=address_data.district,
            street=address_data.street,
            is_default=address_data.is_default,
        )
        self.db.add(address)
        self.db.commit()
        self.db.refresh(address)
        return address

    def update(self, address: Address, address_data: AddressUpdate) -> Address:
        """Update an existing address."""
        for field, value in address_data.model_dump(exclude_unset=True).items():
            setattr(address, field, value)
        self.db.commit()
        self.db.refresh(address)
        return address

    def delete(self, address: Address) -> None:
        """Delete an address."""
        self.db.delete(address)
        self.db.commit()

    def set_default(self, user_id: int, address_id: int) -> None:
        """Set an address as default, unset others."""
        # Unset all defaults for user
        self.db.query(Address).filter(Address.user_id == user_id, Address.is_default).update({"is_default": False})
        # Set new default
        address = self.get_by_id(address_id)
        if address and address.user_id == user_id:
            address.is_default = True
            self.db.commit()
