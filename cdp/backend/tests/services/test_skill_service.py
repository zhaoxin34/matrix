"""Tests for SkillService."""

from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.skill import SkillLevel
from app.schemas.skill import SkillCreate, SkillUpdate
from app.services.skill_service import SkillService


class TestSkillService:
    """Test SkillService class."""

    def test_create_skill(self, mock_db):
        """Test creating a new skill."""
        mock_skill_repo = MagicMock()
        service = SkillService(mock_db)
        service.repo = mock_skill_repo

        data = SkillCreate(
            code="java",
            name="Java",
            level=SkillLevel.Functional,
            tags=["编程", "后端"],
            author="测试",
            content="Java 技能描述",
        )

        mock_skill_repo.get_by_code_or_none.return_value = None
        mock_skill_repo.create.return_value = MagicMock(code="java", name="Java", level=SkillLevel.Functional)

        skill = service.create_skill(data)

        assert skill is not None
        assert skill.code == "java"
        mock_skill_repo.create.assert_called_once()

    def test_create_skill_duplicate_code(self, mock_db, sample_skill):
        """Test creating skill with duplicate code raises error."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code_or_none.return_value = sample_skill

        data = SkillCreate(
            code="python",  # Same as sample_skill
            name="Python 2",
            level=SkillLevel.Atomic,
            tags=[],
            author="测试",
            content="重复代码",
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_skill(data)

        assert exc_info.value.status_code == 409
        assert "code already exists" in exc_info.value.detail

    def test_get_skill_found(self, mock_db, sample_skill):
        """Test getting existing skill."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code.return_value = sample_skill

        skill = service.get_skill("python")

        assert skill is not None
        assert skill.code == "python"
        assert skill.name == "Python"

    def test_get_skill_not_found(self, mock_db):
        """Test getting non-existent skill raises error."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.get_skill("nonexistent")

        assert exc_info.value.status_code == 404
        assert "Skill not found" in exc_info.value.detail

    def test_update_skill(self, mock_db, sample_skill):
        """Test updating a skill."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code.return_value = sample_skill
        service.repo.update.return_value = sample_skill

        data = SkillUpdate(name="Python 3", level=SkillLevel.Atomic)

        skill = service.update_skill("python", data)

        assert skill is not None
        assert sample_skill.name == "Python 3"
        assert sample_skill.level == SkillLevel.Atomic

    def test_update_skill_not_found(self, mock_db):
        """Test updating non-existent skill raises error."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code.return_value = None

        data = SkillUpdate(name="New Name")

        with pytest.raises(HTTPException) as exc_info:
            service.update_skill("nonexistent", data)

        assert exc_info.value.status_code == 404

    def test_delete_skill(self, mock_db, sample_skill):
        """Test soft deleting a skill."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code.return_value = sample_skill
        service.repo.soft_delete = MagicMock()

        service.delete_skill("python")

        service.repo.soft_delete.assert_called_once_with(sample_skill)

    def test_delete_skill_not_found(self, mock_db):
        """Test deleting non-existent skill raises error."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.delete_skill("nonexistent")

        assert exc_info.value.status_code == 404

    def test_activate_skill(self, mock_db, sample_skill):
        """Test activating a skill."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code.return_value = sample_skill
        sample_skill.is_active = True
        service.repo.activate.return_value = sample_skill

        skill = service.activate_skill("python")

        assert skill.is_active is True

    def test_deactivate_skill(self, mock_db, sample_skill):
        """Test deactivating a skill."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.get_by_code.return_value = sample_skill

        def mock_deactivate(skill):
            skill.is_active = False
            return skill

        service.repo.deactivate.side_effect = mock_deactivate

        service.deactivate_skill("python")

        assert sample_skill.is_active is False

    def test_list_skills_pagination(self, mock_db, sample_skill):
        """Test listing skills with pagination."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.list.return_value = ([sample_skill], 1)

        result = service.list_skills(page=1, page_size=10)

        assert result is not None
        assert result.page == 1
        assert result.page_size == 10
        assert result.total == 1

    def test_list_skills_filter_by_level(self, mock_db, sample_skill):
        """Test listing skills filtered by level."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.list.return_value = ([sample_skill], 1)

        result = service.list_skills(level=SkillLevel.Functional)

        assert result is not None
        for item in result.items:
            assert item.level == SkillLevel.Functional

    def test_list_skills_filter_by_tags(self, mock_db, sample_skill):
        """Test listing skills filtered by tags."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.list.return_value = ([sample_skill], 1)

        result = service.list_skills(tags=["编程"])

        assert result is not None

    def test_list_skills_include_deleted(self, mock_db, sample_skill):
        """Test listing skills including deleted."""
        service = SkillService(mock_db)
        service.repo = MagicMock()
        service.repo.list.return_value = ([sample_skill], 1)

        result = service.list_skills(include_deleted=True)

        assert result is not None
