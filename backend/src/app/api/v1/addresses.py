"""Addresses API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate

router = APIRouter()


@router.get("", response_model=list[AddressResponse])
def list_addresses(
    user_id: int = 1, db: Session = Depends(get_db)
) -> list[AddressResponse]:
    """List all addresses for a user."""
    addresses = db.query(Address).filter(Address.user_id == user_id).all()
    return addresses


@router.get("/{address_id}", response_model=AddressResponse)
def get_address(address_id: int, db: Session = Depends(get_db)) -> AddressResponse:
    """Get address by ID."""
    address = db.query(Address).filter(Address.id == address_id).first()
    if not address:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Address not found")
    return address


@router.post("", response_model=AddressResponse)
def create_address(
    address_data: AddressCreate, user_id: int = 1, db: Session = Depends(get_db)
) -> AddressResponse:
    """Create a new address."""
    if address_data.is_default:
        db.query(Address).filter(Address.user_id == user_id).update(
            {"is_default": False}
        )

    address = Address(
        user_id=user_id,
        name=address_data.name,
        phone=address_data.phone,
        address=address_data.address,
        is_default=address_data.is_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: int, address_data: AddressUpdate, db: Session = Depends(get_db)
) -> AddressResponse:
    """Update address by ID."""
    address = db.query(Address).filter(Address.id == address_id).first()
    if not address:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Address not found")

    if address_data.is_default:
        db.query(Address).filter(Address.user_id == address.user_id).update(
            {"is_default": False}
        )

    for field, value in address_data.model_dump(exclude_unset=True).items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}")
def delete_address(address_id: int, db: Session = Depends(get_db)) -> dict:
    """Delete address by ID."""
    address = db.query(Address).filter(Address.id == address_id).first()
    if not address:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Address not found")

    db.delete(address)
    db.commit()
    return {"message": "Address deleted successfully"}
