"""Unit tests for TaskService."""

from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_CONFLICT,
    ERR_NOT_FOUND,
    ERR_TASK_ALREADY_DISABLED,
    ERR_TASK_ALREADY_ENABLED,
    ERR_TASK_ALREADY_SUCCEEDED,
    ERR_TASK_HAS_RECORDS,
    ERR_TASK_INVALID_CRON,
    ERR_TASK_INVALID_TYPE,
    ERR_TASK_NOT_FOUND,
    ERR_TASK_RUNNING,
)
from app.core.exceptions import BusinessException
from app.schemas.task import TaskPriority, TaskStatus, TaskType
from app.services.task_service import TaskService


@pytest.fixture
def mock_db():
    """Create mock database session."""
    return MagicMock(spec=Session)


@pytest.fixture
def task_service(mock_db):
    """Create TaskService instance with mocked dependencies."""
    return TaskService(mock_db)


@pytest.fixture
def mock_task_repo(mock_db):
    """Create mock TaskRepository."""
    from app.repositories.task_repository import TaskRepository

    return MagicMock(spec=TaskRepository)


@pytest.fixture
def mock_record_repo(mock_db):
    """Create mock TaskRecordRepository."""
    from app.repositories.task_repository import TaskRecordRepository

    return MagicMock(spec=TaskRecordRepository)


@pytest.fixture
def sample_workspace():
    """Create sample workspace."""
    workspace = MagicMock()
    workspace.id = 1
    workspace.code = "test_workspace"
    return workspace


@pytest.fixture
def sample_task():
    """Create sample periodic task."""
    task = MagicMock()
    task.id = 1
    task.name = "test-task"
    task.description = "Test task description"
    task.content = "Test task content"
    task.workspace_id = 1
    task.agent_id = 1
    task.owner_id = 1
    task.priority = TaskPriority.MEDIUM.value
    task.task_type = TaskType.PERIODIC.value
    task.last_exec_status = "pending"
    task.status = TaskStatus.ENABLED.value
    task.max_retry = 3
    task.retry_interval = 60
    task.webhook_url = "https://example.com/webhook"
    task.cron_expression = "0 0 * * *"
    task.created_at = "2024-01-01T00:00:00"
    task.updated_at = "2024-01-01T00:00:00"
    return task


@pytest.fixture
def sample_record():
    """Create sample task record."""
    record = MagicMock()
    record.id = 1
    record.task_id = 1
    record.started_at = "2024-01-01T00:00:00"
    record.ended_at = "2024-01-01T00:01:00"
    record.duration = 60
    record.exec_status = "success"
    record.result = '{"status": "ok"}'
    record.process = {}
    record.failure_reason = None
    record.recording_url = None
    record.created_at = "2024-01-01T00:00:00"
    return record


# ============================================================================
# Test _get_workspace_id
# ============================================================================


class TestGetWorkspaceId:
    """Tests for _get_workspace_id method."""

    def test_workspace_not_found(self, task_service, mock_db):
        """Test error when workspace not found."""

        with patch("app.services.task_service.get_workspace_by_code", return_value=None):
            with pytest.raises(BusinessException) as exc_info:
                task_service._get_workspace_id("nonexistent")
            assert exc_info.value.code == ERR_NOT_FOUND

    def test_workspace_found(self, task_service, sample_workspace):
        """Test successful workspace lookup."""
        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            workspace_id = task_service._get_workspace_id("test_workspace")
            assert workspace_id == 1


# ============================================================================
# Test _validate_cron
# ============================================================================


class TestValidateCron:
    """Tests for _validate_cron method."""

    def test_valid_cron(self, task_service):
        """Test valid cron expression."""
        # Should not raise
        task_service._validate_cron("0 0 * * *")  # Daily at midnight
        task_service._validate_cron("*/5 * * * *")  # Every 5 minutes
        task_service._validate_cron("0 9-17 * * 1-5")  # Business hours

    def test_empty_cron(self, task_service):
        """Test empty cron expression (allowed)."""
        # Should not raise
        task_service._validate_cron(None)
        task_service._validate_cron("")

    def test_invalid_cron(self, task_service):
        """Test invalid cron expression raises error."""
        with pytest.raises(BusinessException) as exc_info:
            task_service._validate_cron("invalid")
        assert exc_info.value.code == ERR_TASK_INVALID_CRON

    def test_invalid_cron_format(self, task_service):
        """Test invalid cron format raises error."""
        with pytest.raises(BusinessException) as exc_info:
            task_service._validate_cron("6025 32 13 8")  # Invalid values
        assert exc_info.value.code == ERR_TASK_INVALID_CRON


# ============================================================================
# Test get_task
# ============================================================================


class TestGetTask:
    """Tests for get_task method."""

    def test_task_not_found(self, task_service, sample_workspace, mock_task_repo):
        """Test error when task not found."""
        task_service.task_repo = mock_task_repo
        mock_task_repo.get_by_id.return_value = None

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.get_task("test_workspace", 999)
            assert exc_info.value.code == ERR_TASK_NOT_FOUND

    def test_task_wrong_workspace(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when task belongs to different workspace."""
        task_service.task_repo = mock_task_repo
        sample_task.workspace_id = 999  # Different workspace
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.get_task("test_workspace", 1)
            assert exc_info.value.code == ERR_TASK_NOT_FOUND

    def test_get_task_success(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test successful task retrieval."""
        task_service.task_repo = mock_task_repo
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            result = task_service.get_task("test_workspace", 1)
            assert result == sample_task


# ============================================================================
# Test list_tasks
# ============================================================================


class TestListTasks:
    """Tests for list_tasks method."""

    def test_list_tasks_success(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test successful task listing."""
        task_service.task_repo = mock_task_repo
        mock_task_repo.list_tasks.return_value = ([sample_task], 1)

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            tasks, total = task_service.list_tasks("test_workspace")
            assert tasks == [sample_task]
            assert total == 1
            mock_task_repo.list_tasks.assert_called_once()

    def test_list_tasks_with_filters(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test task listing with filters."""
        task_service.task_repo = mock_task_repo
        mock_task_repo.list_tasks.return_value = ([sample_task], 1)

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            tasks, total = task_service.list_tasks(
                "test_workspace",
                last_exec_status="pending",
                task_type="periodic",
                priority="medium",
                search="test",
            )
            assert tasks == [sample_task]
            assert total == 1


# ============================================================================
# Test create_task
# ============================================================================


class TestCreateTask:
    """Tests for create_task method."""

    def test_create_task_invalid_cron(self, task_service, sample_workspace, mock_task_repo):
        """Test task creation with invalid cron expression."""
        task_service.task_repo = mock_task_repo

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.create_task(
                    "test_workspace",
                    {
                        "name": "test-task",
                        "agent_id": 1,
                        "cron_expression": "invalid",
                    },
                    user_id=1,
                )
            assert exc_info.value.code == ERR_TASK_INVALID_CRON


# ============================================================================
# Test update_task
# ============================================================================


class TestUpdateTask:
    """Tests for update_task method."""

    def test_update_task_success(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test successful task update."""
        task_service.task_repo = mock_task_repo
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.update.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            result = task_service.update_task("test_workspace", 1, {"name": "updated-task"})
            assert result == sample_task

    def test_update_non_periodic_task(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when updating non-periodic task."""
        task_service.task_repo = mock_task_repo
        sample_task.task_type = "temporary"
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.update_task("test_workspace", 1, {"name": "updated-task"})
            assert exc_info.value.code == ERR_TASK_INVALID_TYPE

    def test_update_running_task(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when updating running task."""
        task_service.task_repo = mock_task_repo
        sample_task.last_exec_status = "running"
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.update_task("test_workspace", 1, {"name": "updated-task"})
            assert exc_info.value.code == ERR_TASK_RUNNING

    def test_update_task_invalid_cron(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test task update with invalid cron expression."""
        task_service.task_repo = mock_task_repo
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.update_task(
                    "test_workspace",
                    1,
                    {"cron_expression": "invalid"},
                )
            assert exc_info.value.code == ERR_TASK_INVALID_CRON


# ============================================================================
# Test delete_task
# ============================================================================


class TestDeleteTask:
    """Tests for delete_task method."""

    def test_delete_task_success(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test successful task deletion."""
        task_service.task_repo = mock_task_repo
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.has_records.return_value = False

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            task_service.delete_task("test_workspace", 1)
            mock_task_repo.delete.assert_called_once_with(sample_task)

    def test_delete_non_periodic_task(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when deleting non-periodic task."""
        task_service.task_repo = mock_task_repo
        sample_task.task_type = "temporary"
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.delete_task("test_workspace", 1)
            assert exc_info.value.code == ERR_TASK_INVALID_TYPE

    def test_delete_task_with_records(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when deleting task with execution records."""
        task_service.task_repo = mock_task_repo
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.has_records.return_value = True

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.delete_task("test_workspace", 1)
            assert exc_info.value.code == ERR_TASK_HAS_RECORDS


# ============================================================================
# Test cancel_task
# ============================================================================


class TestCancelTask:
    """Tests for cancel_task method."""

    def test_cancel_task_success(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test successful task cancellation."""
        task_service.task_repo = mock_task_repo
        sample_task.last_exec_status = "pending"
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.update_exec_status.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            result = task_service.cancel_task("test_workspace", 1)
            assert result == sample_task
            mock_task_repo.update_exec_status.assert_called_once_with(sample_task, "cancelled")

    def test_cancel_succeeded_task(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when cancelling succeeded task."""
        task_service.task_repo = mock_task_repo
        sample_task.last_exec_status = "success"
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.cancel_task("test_workspace", 1)
            assert exc_info.value.code == ERR_TASK_ALREADY_SUCCEEDED

    def test_cancel_already_cancelled_task(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when cancelling already cancelled task."""
        task_service.task_repo = mock_task_repo
        sample_task.last_exec_status = "cancelled"
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.cancel_task("test_workspace", 1)
            assert exc_info.value.code == ERR_CONFLICT


# ============================================================================
# Test disable_task
# ============================================================================


class TestDisableTask:
    """Tests for disable_task method."""

    def test_disable_task_success(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test successful task disable."""
        task_service.task_repo = mock_task_repo
        sample_task.status = "enabled"
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.update_status.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            result = task_service.disable_task("test_workspace", 1)
            assert result == sample_task
            mock_task_repo.update_status.assert_called_once_with(sample_task, "disabled")

    def test_disable_already_disabled_task(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when disabling already disabled task."""
        task_service.task_repo = mock_task_repo
        sample_task.status = "disabled"
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.disable_task("test_workspace", 1)
            assert exc_info.value.code == ERR_TASK_ALREADY_DISABLED


# ============================================================================
# Test enable_task
# ============================================================================


class TestEnableTask:
    """Tests for enable_task method."""

    def test_enable_task_success(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test successful task enable."""
        task_service.task_repo = mock_task_repo
        sample_task.status = "disabled"
        mock_task_repo.get_by_id.return_value = sample_task
        mock_task_repo.update_status.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            result = task_service.enable_task("test_workspace", 1)
            assert result == sample_task
            mock_task_repo.update_status.assert_called_once_with(sample_task, "enabled")

    def test_enable_already_enabled_task(self, task_service, sample_workspace, sample_task, mock_task_repo):
        """Test error when enabling already enabled task."""
        task_service.task_repo = mock_task_repo
        sample_task.status = "enabled"
        mock_task_repo.get_by_id.return_value = sample_task

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.enable_task("test_workspace", 1)
            assert exc_info.value.code == ERR_TASK_ALREADY_ENABLED


# ============================================================================
# Test list_task_records
# ============================================================================


class TestListTaskRecords:
    """Tests for list_task_records method."""

    def test_list_records_success(self, task_service, sample_workspace, sample_task, mock_task_repo, mock_record_repo):
        """Test successful records listing."""
        task_service.task_repo = mock_task_repo
        task_service.record_repo = mock_record_repo
        mock_task_repo.get_by_id.return_value = sample_task
        mock_record_repo.list_by_task.return_value = ([], 0)

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            records, total = task_service.list_task_records("test_workspace", 1)
            assert records == []
            assert total == 0


# ============================================================================
# Test get_task_record
# ============================================================================


class TestGetTaskRecord:
    """Tests for get_task_record method."""

    def test_get_record_success(
        self, task_service, sample_workspace, sample_task, sample_record, mock_task_repo, mock_record_repo
    ):
        """Test successful record retrieval."""
        task_service.task_repo = mock_task_repo
        task_service.record_repo = mock_record_repo
        mock_task_repo.get_by_id.return_value = sample_task
        mock_record_repo.get_by_id.return_value = sample_record

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            result = task_service.get_task_record("test_workspace", 1, 1)
            assert result == sample_record

    def test_get_record_not_found(self, task_service, sample_workspace, sample_task, mock_task_repo, mock_record_repo):
        """Test error when record not found."""
        task_service.task_repo = mock_task_repo
        task_service.record_repo = mock_record_repo
        mock_task_repo.get_by_id.return_value = sample_task
        mock_record_repo.get_by_id.return_value = None

        with patch(
            "app.services.task_service.get_workspace_by_code",
            return_value=sample_workspace,
        ):
            with pytest.raises(BusinessException) as exc_info:
                task_service.get_task_record("test_workspace", 1, 999)
            assert exc_info.value.code == ERR_NOT_FOUND
