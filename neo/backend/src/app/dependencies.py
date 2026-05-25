"""Dependencies injection."""

from app.database import SessionLocal


def get_session():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
