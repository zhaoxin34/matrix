"""Database seeding script."""
from app.core.security import get_password_hash
from app.database import SessionLocal, engine, Base
from app.models import User, Category, Product, Address


def seed_database() -> None:
    """Seed the database with sample data."""
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if data already exists
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping...")
            return

        # Create admin user
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            is_admin=True,
        )
        db.add(admin)

        # Create test user
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("test123"),
            is_admin=False,
        )
        db.add(user)
        db.commit()

        # Create categories
        categories = [
            Category(name="Electronics", description="Electronic devices and accessories"),
            Category(name="Clothing", description="Fashion and apparel"),
            Category(name="Books", description="Books and publications"),
        ]
        for category in categories:
            db.add(category)
        db.commit()

        # Create products
        products = [
            Product(name="Laptop", description="High-performance laptop", price=999.99, stock=10, category_id=1),
            Product(name="Smartphone", description="Latest smartphone", price=699.99, stock=20, category_id=1),
            Product(name="T-Shirt", description="Cotton t-shirt", price=29.99, stock=50, category_id=2),
            Product(name="Jeans", description="Denim jeans", price=59.99, stock=30, category_id=2),
            Product(name="Python Book", description="Learn Python programming", price=49.99, stock=100, category_id=3),
        ]
        for product in products:
            db.add(product)
        db.commit()

        # Create addresses
        addresses = [
            Address(user_id=2, name="Home", phone="1234567890", address="123 Main St", is_default=True),
            Address(user_id=2, name="Office", phone="0987654321", address="456 Business Ave", is_default=False),
        ]
        for address in addresses:
            db.add(address)
        db.commit()

        print("Database seeded successfully!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
