"""Address service."""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories.address_repo import AddressRepository
from app.schemas.address import AddressCreate, AddressUpdate


class AddressService:
    """Address service for business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repo = AddressRepository(db)

    def get_by_id(self, address_id: int):
        """Get address by ID."""
        address = self.repo.get_by_id(address_id)
        if not address:
            raise NotFoundException("Address not found")
        return address

    def get_by_user(self, user_id: int) -> list:
        """Get all addresses for a user."""
        return self.repo.get_by_user(user_id)

    def get_default(self, user_id: int):
        """Get default address for a user."""
        return self.repo.get_default(user_id)

    def create(self, user_id: int, address_data: AddressCreate):
        """Create a new address."""
        # If is_default=True, unset all others first
        if address_data.is_default:
            self.repo.set_default(user_id, 0)
        return self.repo.create(user_id, address_data)

    def update(self, address_id: int, address_data: AddressUpdate):
        """Update an existing address."""
        address = self.get_by_id(address_id)
        if address_data.is_default:
            self.repo.set_default(address.user_id, address_id)
        return self.repo.update(address, address_data)

    def delete(self, address_id: int) -> None:
        """Delete an address."""
        address = self.get_by_id(address_id)
        self.repo.delete(address)

    def set_default(self, user_id: int, address_id: int) -> None:
        """Set an address as default."""
        self.repo.set_default(user_id, address_id)
