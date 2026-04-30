"""Tests for database module."""

from sati.database import UserModel


class TestUserModel:
    """Test UserModel ORM class."""

    def test_create_user_model(self) -> None:
        """Can create a UserModel instance."""
        user = UserModel(
            user_id="test-uuid-123",
            age=30,
            gender=1,
            marital_status=1,
            child_count=1,
            child_age_group=2,
            has_house=2,
            has_car=1,
            has_mortgage=0,
            has_car_loan=1,
            has_other_loan=0,
            dependent_parents=1,
            occupation_type=3,
            employment_status=1,
            industry=1,
            work_experience=8,
            education_level=4,
            income_monthly=15000,
            income_stable=2,
            savings_level=3,
            has_investment=1,
            spending_style=2,
            payment_preference=1,
        )
        assert user.user_id == "test-uuid-123"
        assert user.age == 30
        assert user.income_monthly == 15000

    def test_user_model_has_created_at_field(self) -> None:
        """UserModel has created_at attribute."""
        user = UserModel(
            user_id="test-uuid-456",
            age=25,
            gender=0,
            marital_status=0,
            child_count=0,
            child_age_group=0,
            has_house=0,
            has_car=0,
            has_mortgage=0,
            has_car_loan=0,
            has_other_loan=0,
            dependent_parents=0,
            occupation_type=1,
            employment_status=4,
            industry=1,
            work_experience=0,
            education_level=3,
            income_monthly=3000,
            income_stable=1,
            savings_level=1,
            has_investment=0,
            spending_style=1,
            payment_preference=1,
        )
        assert hasattr(user, "created_at")


class TestDatabaseIntegration:
    """Test database integration (requires MySQL)."""

    def test_database_config_loaded(self) -> None:
        """Database config is properly loaded."""
        # Import after config is set
        from sati.config import DB_HOST, DB_NAME, DB_PORT, DB_USER

        assert DB_HOST == "127.0.0.1"
        assert DB_PORT == 3306
        assert DB_USER == "root"
        assert DB_NAME == "sati"

    def test_database_url_format(self) -> None:
        """DATABASE_URL is properly formatted."""
        from sati.config import DATABASE_URL

        assert "mysql+pymysql://" in DATABASE_URL
        assert "root:root" in DATABASE_URL
        assert "127.0.0.1:3306" in DATABASE_URL
        assert "/sati" in DATABASE_URL
