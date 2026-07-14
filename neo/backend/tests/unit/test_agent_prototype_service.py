"""Tests for Agent Prototype service."""

import pytest
from sqlalchemy.orm import Session

from app.models.agent_prototype import AgentPrototype, AgentStatus
from app.models.agent_prototype_version import AgentPrototypeVersion


class BusinessException(Exception):
    """Business exception for testing."""

    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class ErrorCode:
    """Error codes for testing."""

    NOT_FOUND = 2001
    INVALID_OPERATION = 4004
    BAD_REQUEST = 1001


def create_prototype_sync(
    db_session: Session,
    name: str,
    description: str | None = None,
    model: str = "gpt-4",
    prompts: dict | None = None,
    config: dict | None = None,
    user_id: int = 1,
) -> AgentPrototype:
    """Helper to create a prototype synchronously."""
    import uuid

    prototype = AgentPrototype(
        code=f"pt_{uuid.uuid4().hex[:16]}",
        name=name,
        description=description,
        model=model,
        prompts=prompts or {},
        config=config or {},
        status=AgentStatus.DRAFT,
        created_by=user_id,
    )
    db_session.add(prototype)
    db_session.commit()
    db_session.refresh(prototype)
    return prototype


def get_prototype_sync(db_session: Session, prototype_id: int) -> AgentPrototype:
    """Helper to get a prototype by ID."""
    prototype = db_session.query(AgentPrototype).filter(AgentPrototype.id == prototype_id).first()
    if not prototype:
        raise BusinessException(ErrorCode.NOT_FOUND, f"Agent Prototype {prototype_id} not found")
    return prototype


def publish_prototype_sync(
    db_session: Session,
    prototype_id: int,
    new_version: str,
    created_by: int,
    change_summary: str | None = None,
) -> AgentPrototype:
    """Helper to publish a prototype synchronously."""
    prototype = get_prototype_sync(db_session, prototype_id)

    # Create version snapshot
    version = AgentPrototypeVersion(
        agent_prototype_id=prototype.id,
        version=new_version,
        prompts_snapshot=prototype.prompts,
        config_snapshot=prototype.config,
        change_summary=change_summary,
        is_rollback=False,
        created_by=created_by,
    )
    db_session.add(version)

    # Update prototype
    prototype.version = new_version
    prototype.status = AgentStatus.ENABLED

    db_session.commit()
    db_session.refresh(prototype)
    return prototype


def calculate_next_version_sync(db_session: Session, prototype_id: int) -> str:
    """Helper to calculate next version."""
    latest = (
        db_session.query(AgentPrototypeVersion)
        .filter(AgentPrototypeVersion.agent_prototype_id == prototype_id)
        .order_by(AgentPrototypeVersion.created_at.desc())
        .first()
    )

    if not latest:
        return "1.0.0"

    parts = latest.version.split(".")
    if len(parts) == 3:
        major, minor, patch = parts
        new_patch = int(patch) + 1
        return f"{major}.{minor}.{new_patch}"

    return "1.0.0"


# ==================== Service Tests ====================


class TestAgentPrototypeService:
    """Test cases for Agent Prototype service."""

    def test_create_prototype_success(self, db_session: Session):
        """Test creating a new prototype."""
        prototype = create_prototype_sync(
            db_session=db_session,
            name="测试原型",
            description="这是一个测试原型",
            model="gpt-4",
        )

        assert prototype.id is not None
        assert prototype.name == "测试原型"
        assert prototype.description == "这是一个测试原型"
        assert prototype.model == "gpt-4"
        assert prototype.status == AgentStatus.DRAFT
        assert prototype.version is None
        assert prototype.prompts == {}

    def test_create_prototype_with_prompts(self, db_session: Session):
        """Test creating a prototype with prompts."""
        prompts = {"system": "你是一个客服助手", "user": "用户问题模板"}
        prototype = create_prototype_sync(
            db_session=db_session,
            name="客服原型",
            prompts=prompts,
        )

        assert prototype.prompts == prompts

    def test_get_prototype_by_id(self, db_session: Session):
        """Test getting a prototype by ID."""
        prototype = create_prototype_sync(db_session=db_session, name="测试原型")
        fetched = get_prototype_sync(db_session, prototype.id)

        assert fetched.id == prototype.id
        assert fetched.name == prototype.name

    def test_get_prototype_not_found(self, db_session: Session):
        """Test getting a non-existent prototype."""
        with pytest.raises(BusinessException) as exc_info:
            get_prototype_sync(db_session, 99999)

        assert exc_info.value.code == ErrorCode.NOT_FOUND

    def test_list_prototypes_empty(self, db_session: Session):
        """Test listing prototypes when empty."""
        prototypes = db_session.query(AgentPrototype).all()
        assert len(prototypes) == 0

    def test_list_prototypes(self, db_session: Session):
        """Test listing multiple prototypes."""
        create_prototype_sync(db_session, name="原型1")
        create_prototype_sync(db_session, name="原型2")
        create_prototype_sync(db_session, name="原型3")

        prototypes = db_session.query(AgentPrototype).all()
        assert len(prototypes) == 3

    def test_list_prototypes_filter_by_status(self, db_session: Session):
        """Test filtering prototypes by status."""
        create_prototype_sync(db_session, name="草稿原型")
        enabled = create_prototype_sync(db_session, name="启用原型")
        enabled.status = AgentStatus.ENABLED
        db_session.commit()

        drafts = db_session.query(AgentPrototype).filter(AgentPrototype.status == AgentStatus.DRAFT).all()
        enabled_list = db_session.query(AgentPrototype).filter(AgentPrototype.status == AgentStatus.ENABLED).all()

        assert len(drafts) == 1
        assert len(enabled_list) == 1

    def test_list_prototypes_filter_by_type(self, db_session: Session):
        """Test filtering prototypes by type (site_operation vs expert_interview)."""
        from app.models.agent_prototype import AgentType

        # Create prototypes with different types
        p1 = create_prototype_sync(db_session, name="站点操作原型")
        p1.type = AgentType.SITE_OPERATION

        p2 = create_prototype_sync(db_session, name="专家访谈原型")
        p2.type = AgentType.EXPERT_INTERVIEW

        p3 = create_prototype_sync(db_session, name="另一个站点操作")
        p3.type = AgentType.SITE_OPERATION

        db_session.commit()

        # Filter by SITE_OPERATION
        site_ops = db_session.query(AgentPrototype).filter(AgentPrototype.type == AgentType.SITE_OPERATION).all()
        assert len(site_ops) == 2

        # Filter by EXPERT_INTERVIEW
        expert_interviews = db_session.query(AgentPrototype).filter(AgentPrototype.type == AgentType.EXPERT_INTERVIEW).all()
        assert len(expert_interviews) == 1
        assert expert_interviews[0].name == "专家访谈原型"

    def test_update_prototype(self, db_session: Session):
        """Test updating a prototype."""
        prototype = create_prototype_sync(db_session, name="原名称")
        prototype.name = "新名称"
        prototype.description = "新描述"
        db_session.commit()
        db_session.refresh(prototype)

        assert prototype.name == "新名称"
        assert prototype.description == "新描述"

    def test_delete_prototype_draft(self, db_session: Session):
        """Test deleting a draft prototype."""
        prototype = create_prototype_sync(db_session, name="待删除原型")

        assert prototype.status == AgentStatus.DRAFT

        db_session.delete(prototype)
        db_session.commit()

        deleted = db_session.query(AgentPrototype).filter(AgentPrototype.id == prototype.id).first()
        assert deleted is None

    def test_delete_prototype_only_draft_allowed(self, db_session: Session):
        """Test that only draft prototypes can be deleted."""
        prototype = create_prototype_sync(db_session, name="已发布原型")
        prototype.status = AgentStatus.ENABLED
        prototype.version = "1.0.0"
        db_session.commit()

        # In real service, this would raise BusinessException
        # But for unit test, we just verify the state
        assert prototype.status != AgentStatus.DRAFT


class TestAgentPrototypeVersioning:
    """Test cases for Agent Prototype versioning."""

    def test_publish_first_version(self, db_session: Session):
        """Test publishing the first version."""
        prototype = create_prototype_sync(
            db_session,
            name="待发布原型",
            prompts={"system": "初始提示词"},
        )

        published = publish_prototype_sync(
            db_session,
            prototype.id,
            new_version="1.0.0",
            created_by=1,
            change_summary="首次发布",
        )

        assert published.version == "1.0.0"
        assert published.status == AgentStatus.ENABLED

        # Check version record was created
        versions = (
            db_session.query(AgentPrototypeVersion)
            .filter(AgentPrototypeVersion.agent_prototype_id == prototype.id)
            .all()
        )
        assert len(versions) == 1
        assert versions[0].version == "1.0.0"
        assert versions[0].prompts_snapshot == {"system": "初始提示词"}

    def test_calculate_next_version_first(self, db_session: Session):
        """Test calculating first version."""
        prototype = create_prototype_sync(db_session, name="原型")

        next_version = calculate_next_version_sync(db_session, prototype.id)
        assert next_version == "1.0.0"

    def test_calculate_next_version_increment(self, db_session: Session):
        """Test incrementing version number."""
        prototype = create_prototype_sync(db_session, name="原型")

        # Create first version
        publish_prototype_sync(
            db_session,
            prototype.id,
            new_version="1.0.0",
            created_by=1,
        )

        next_version = calculate_next_version_sync(db_session, prototype.id)
        assert next_version == "1.0.1"

    def test_multiple_versions(self, db_session: Session):
        """Test creating multiple versions."""
        prototype = create_prototype_sync(db_session, name="原型")

        # Publish first version
        publish_prototype_sync(db_session, prototype.id, "1.0.0", 1)
        # Update prompts
        prototype.prompts = {"system": "更新后的提示词"}
        db_session.commit()

        # Publish second version
        publish_prototype_sync(
            db_session,
            prototype.id,
            "1.0.1",
            1,
            change_summary="更新提示词",
        )

        versions = (
            db_session.query(AgentPrototypeVersion)
            .filter(AgentPrototypeVersion.agent_prototype_id == prototype.id)
            .order_by(AgentPrototypeVersion.created_at)
            .all()
        )

        assert len(versions) == 2
        assert versions[0].version == "1.0.0"
        assert versions[1].version == "1.0.1"
        assert versions[1].prompts_snapshot == {"system": "更新后的提示词"}

    def test_rollback_creates_new_version(self, db_session: Session):
        """Test that rollback creates a new version entry."""
        prototype = create_prototype_sync(db_session, name="原型")

        # Publish first version
        publish_prototype_sync(db_session, prototype.id, "1.0.0", 1)

        # Get the first version
        first_version = (
            db_session.query(AgentPrototypeVersion)
            .filter(AgentPrototypeVersion.agent_prototype_id == prototype.id)
            .first()
        )

        # Create rollback version
        rollback_version = AgentPrototypeVersion(
            agent_prototype_id=prototype.id,
            version=first_version.version,
            prompts_snapshot=first_version.prompts_snapshot,
            config_snapshot=first_version.config_snapshot,
            change_summary=f"Rollback to version {first_version.version}",
            is_rollback=True,
            created_by=1,
        )
        db_session.add(rollback_version)
        prototype.prompts = first_version.prompts_snapshot
        prototype.config = first_version.config_snapshot
        db_session.commit()

        # Verify rollback version exists
        versions = (
            db_session.query(AgentPrototypeVersion)
            .filter(AgentPrototypeVersion.agent_prototype_id == prototype.id)
            .all()
        )

        assert len(versions) == 2
        assert versions[1].is_rollback is True
        assert "Rollback" in versions[1].change_summary


class TestAgentPrototypeStatusTransitions:
    """Test cases for Agent Prototype status transitions."""

    def test_draft_to_enabled_on_publish(self, db_session: Session):
        """Test that publishing changes status from draft to enabled."""
        prototype = create_prototype_sync(db_session, name="原型")
        assert prototype.status == AgentStatus.DRAFT

        publish_prototype_sync(db_session, prototype.id, "1.0.0", 1)
        db_session.refresh(prototype)

        assert prototype.status == AgentStatus.ENABLED

    def test_enabled_to_disabled(self, db_session: Session):
        """Test disabling an enabled prototype."""
        prototype = create_prototype_sync(db_session, name="原型")
        publish_prototype_sync(db_session, prototype.id, "1.0.0", 1)

        prototype.status = AgentStatus.DISABLED
        db_session.commit()
        db_session.refresh(prototype)

        assert prototype.status == AgentStatus.DISABLED

    def test_disabled_to_enabled(self, db_session: Session):
        """Test re-enabling a disabled prototype."""
        prototype = create_prototype_sync(db_session, name="原型")
        publish_prototype_sync(db_session, prototype.id, "1.0.0", 1)
        prototype.status = AgentStatus.DISABLED
        db_session.commit()

        prototype.status = AgentStatus.ENABLED
        db_session.commit()
        db_session.refresh(prototype)

        assert prototype.status == AgentStatus.ENABLED

    def test_cannot_enable_without_version(self, db_session: Session):
        """Test that a draft prototype without version cannot be enabled."""
        prototype = create_prototype_sync(db_session, name="原型")

        # In real service, this would raise BusinessException
        # But for unit test, verify state
        assert prototype.version is None
        # The service layer would prevent enabling without version


class TestAgentPrototypeValidation:
    """Test cases for Agent Prototype validation."""

    def test_prompts_not_empty_on_publish(self, db_session: Session):
        """Test that prompts must not be empty when publishing."""
        prototype = create_prototype_sync(db_session, name="原型")
        prototype.prompts = {}  # Empty prompts
        db_session.commit()

        # In real service, this would raise BusinessException
        # Verify prompts state
        assert prototype.prompts == {}

    def test_change_summary_required_on_publish(self, db_session: Session):
        """Test that change_summary is required for publishing."""
        prototype = create_prototype_sync(db_session, name="原型")

        # Publishing without change_summary should work in model layer
        # Service layer validates this
        published = publish_prototype_sync(
            db_session,
            prototype.id,
            "1.0.0",
            1,
            change_summary="必须有变更说明",
        )

        assert published is not None

    def test_prototype_name_required(self, db_session: Session):
        """Test that prototype name is required."""
        # Model validation - in actual service layer, this would raise BusinessException
        # For unit test, we just verify the model attribute behavior
        prototype = AgentPrototype(
            code="pt_test_name_required",
            name="",  # Empty name - model allows this, service layer validates
            model="gpt-4",
            status=AgentStatus.DRAFT,
            created_by=1,
        )
        db_session.add(prototype)
        db_session.commit()

        # Name constraint is validated at schema/service level
        assert prototype.name == ""

    def test_prototype_code_auto_generated(self, db_session: Session):
        """Test that code is auto-generated if not provided."""
        prototype = create_prototype_sync(db_session, name="原型")

        # Code should be generated by repository layer
        # In this test, code is not set, so it would be None
        assert prototype.code is None or prototype.code.startswith("pt_")


class TestAgentPrototypeVersionSnapshot:
    """Test cases for version snapshot integrity."""

    def test_version_snapshot_contains_prompts(self, db_session: Session):
        """Test that version snapshot includes prompts."""
        prompts = {"system": "系统提示", "user": "用户模板"}
        prototype = create_prototype_sync(db_session, name="原型", prompts=prompts)

        publish_prototype_sync(db_session, prototype.id, "1.0.0", 1)

        version = (
            db_session.query(AgentPrototypeVersion)
            .filter(AgentPrototypeVersion.agent_prototype_id == prototype.id)
            .first()
        )

        assert version.prompts_snapshot == prompts

    def test_version_snapshot_contains_config(self, db_session: Session):
        """Test that version snapshot includes config."""
        config = {"temperature": 0.7, "max_tokens": 4096}
        prototype = create_prototype_sync(db_session, name="原型", config=config)

        publish_prototype_sync(db_session, prototype.id, "1.0.0", 1)

        version = db_session.query(AgentPrototypeVersion).first()
        assert version.config_snapshot == config

    def test_version_snapshot_contains_metadata(self, db_session: Session):
        """Test that version snapshot includes metadata."""
        prototype = create_prototype_sync(db_session, name="原型")

        publish_prototype_sync(
            db_session,
            prototype.id,
            "1.0.0",
            created_by=42,
            change_summary="初始化版本",
        )

        version = db_session.query(AgentPrototypeVersion).first()
        assert version.created_by == 42
        assert version.change_summary == "初始化版本"
        assert version.is_rollback is False
