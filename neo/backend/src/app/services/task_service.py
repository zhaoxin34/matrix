"""Task service for business logic."""

from croniter import croniter
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
from app.models.task import Task, TaskRecord
from app.repositories.task_repository import TaskRecordRepository, TaskRepository
from app.repositories.workspace_repository import get_workspace_by_code
from app.schemas.task import TaskPriority, TaskType


class TaskService:
    """Service for Task business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.record_repo = TaskRecordRepository(db)

    def _get_workspace_id(self, workspace_code: str) -> int:
        """Get workspace ID by code."""
        workspace = get_workspace_by_code(self.db, workspace_code)
        if not workspace:
            raise BusinessException(ERR_NOT_FOUND, f"Workspace '{workspace_code}' not found")
        return workspace.id

    def _validate_cron(self, cron_expression: str | None) -> None:
        """Validate cron expression format.

        Args:
            cron_expression: Cron expression to validate

        Raises:
            BusinessException if invalid
        """
        if not cron_expression:
            return
        try:
            croniter(cron_expression)
        except (ValueError, KeyError) as e:
            raise BusinessException(ERR_TASK_INVALID_CRON, f"Invalid cron expression: {e!s}")

    def get_task(self, workspace_code: str, task_id: int) -> Task:
        """Get a Task by ID.

        Args:
            workspace_code: Workspace code
            task_id: Task ID

        Returns:
            Task

        Raises:
            BusinessException if not found
        """
        workspace_id = self._get_workspace_id(workspace_code)

        task = self.task_repo.get_by_id(task_id)
        if not task:
            raise BusinessException(ERR_TASK_NOT_FOUND, f"Task {task_id} not found")

        # Verify task belongs to the workspace
        if task.workspace_id != workspace_id:
            raise BusinessException(ERR_TASK_NOT_FOUND, f"Task {task_id} not found in workspace '{workspace_code}'")

        return task

    def list_tasks(
        self,
        workspace_code: str,
        last_exec_status: str | None = None,
        task_type: str | None = None,
        priority: str | None = None,
        agent_id: int | None = None,
        creator_id: int | None = None,
        executor_id: int | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Task], int]:
        """List Tasks in a workspace.

        Args:
            workspace_code: Workspace code
            last_exec_status: Filter by last execution status
            task_type: Filter by task type
            priority: Filter by priority
            agent_id: Filter by agent
            creator_id: Filter by creator
            executor_id: Filter by executor
            search: Search in name/ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (tasks, total_count)
        """
        workspace_id = self._get_workspace_id(workspace_code)
        return self.task_repo.list_tasks(
            workspace_id=workspace_id,
            last_exec_status=last_exec_status,
            task_type=task_type,
            priority=priority,
            agent_id=agent_id,
            creator_id=creator_id,
            executor_id=executor_id,
            search=search,
            page=page,
            page_size=page_size,
        )

    def create_task(self, workspace_code: str, data: dict, user_id: int) -> Task:
        """Create a new periodic Task.

        Args:
            workspace_code: Workspace code
            data: Task creation data
            user_id: Current user ID

        Returns:
            Created Task

        Raises:
            BusinessException if validation fails
        """
        workspace_id = self._get_workspace_id(workspace_code)

        # Validate cron expression
        self._validate_cron(data.get("cron_expression"))

        # executor_id is required
        if "executor_id" not in data:
            raise BusinessException(ERR_CONFLICT, "executor_id is required")

        # Create task
        task = Task(
            name=data["name"],
            description=data.get("description"),
            content=data.get("content"),
            workspace_id=workspace_id,
            agent_id=data["agent_id"],
            creator_id=user_id,
            executor_id=data["executor_id"],
            priority=data.get("priority", TaskPriority.MEDIUM.value),
            task_type=TaskType.PERIODIC.value,  # Only periodic tasks can be created
            last_exec_status="pending",
            status="enabled",
            max_retry=data.get("max_retry", 3),
            retry_interval=data.get("retry_interval", 60),
            webhook_url=data.get("webhook_url"),
            webhook_secret=data.get("webhook_secret"),
            cron_expression=data.get("cron_expression"),
        )

        return self.task_repo.create(task)

    def update_task(self, workspace_code: str, task_id: int, data: dict) -> Task:
        """Update a periodic Task.

        Args:
            workspace_code: Workspace code
            task_id: Task ID
            data: Update data

        Returns:
            Updated Task

        Raises:
            BusinessException if validation fails
        """
        task = self.get_task(workspace_code, task_id)

        # Only periodic tasks can be modified
        if task.task_type != TaskType.PERIODIC.value:
            raise BusinessException(ERR_TASK_INVALID_TYPE, "Only periodic tasks can be modified")

        # Cannot modify a running task
        if task.last_exec_status == "running":
            raise BusinessException(ERR_TASK_RUNNING, "Cannot modify a running task")

        # Validate cron expression
        self._validate_cron(data.get("cron_expression"))

        return self.task_repo.update(task, data)

    def delete_task(self, workspace_code: str, task_id: int) -> None:
        """Delete a periodic Task (only if no records exist).

        Args:
            workspace_code: Workspace code
            task_id: Task ID

        Raises:
            BusinessException if validation fails
        """
        task = self.get_task(workspace_code, task_id)

        # Only periodic tasks can be deleted
        if task.task_type != TaskType.PERIODIC.value:
            raise BusinessException(ERR_TASK_INVALID_TYPE, "Only periodic tasks can be deleted")

        # Check if has execution records
        if self.task_repo.has_records(task_id):
            raise BusinessException(ERR_TASK_HAS_RECORDS, "Cannot delete task with execution records")

        self.task_repo.delete(task)

    def cancel_task(self, workspace_code: str, task_id: int) -> Task:
        """Cancel a Task.

        Args:
            workspace_code: Workspace code
            task_id: Task ID

        Returns:
            Updated Task

        Raises:
            BusinessException if not allowed
        """
        task = self.get_task(workspace_code, task_id)

        # Cannot cancel a successful task
        if task.last_exec_status == "success":
            raise BusinessException(ERR_TASK_ALREADY_SUCCEEDED, "Task has already succeeded")

        # Cannot cancel a cancelled task
        if task.last_exec_status == "cancelled":
            raise BusinessException(ERR_CONFLICT, "Task is already cancelled")

        return self.task_repo.update_exec_status(task, "cancelled")

    def disable_task(self, workspace_code: str, task_id: int) -> Task:
        """Disable a Task.

        Args:
            workspace_code: Workspace code
            task_id: Task ID

        Returns:
            Disabled Task

        Raises:
            BusinessException if not allowed
        """
        task = self.get_task(workspace_code, task_id)

        if task.status == "disabled":
            raise BusinessException(ERR_TASK_ALREADY_DISABLED, "Task is already disabled")

        return self.task_repo.update_status(task, "disabled")

    def enable_task(self, workspace_code: str, task_id: int) -> Task:
        """Enable a Task.

        Args:
            workspace_code: Workspace code
            task_id: Task ID

        Returns:
            Enabled Task

        Raises:
            BusinessException if not allowed
        """
        task = self.get_task(workspace_code, task_id)

        if task.status == "enabled":
            raise BusinessException(ERR_TASK_ALREADY_ENABLED, "Task is already enabled")

        return self.task_repo.update_status(task, "enabled")

    def list_task_records(
        self,
        workspace_code: str,
        task_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[TaskRecord], int]:
        """List execution records for a task.

        Args:
            workspace_code: Workspace code
            task_id: Task ID
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (records, total_count)
        """
        # Verify task exists and belongs to workspace
        self.get_task(workspace_code, task_id)
        return self.record_repo.list_by_task(task_id, page, page_size)

    def get_task_record(self, workspace_code: str, task_id: int, record_id: int) -> TaskRecord:
        """Get a specific execution record.

        Args:
            workspace_code: Workspace code
            task_id: Task ID
            record_id: Record ID

        Returns:
            TaskRecord

        Raises:
            BusinessException if not found
        """
        # Verify task exists and belongs to workspace
        self.get_task(workspace_code, task_id)

        record = self.record_repo.get_by_id(record_id)
        if not record or record.task_id != task_id:
            raise BusinessException(ERR_NOT_FOUND, f"Record {record_id} not found for task {task_id}")

        return record

    def get_my_tasks(
        self,
        user_id: int,
        my_role: str | None = None,
        last_exec_status: str | None = None,
        task_type: str | None = None,
        priority: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Task], int]:
        """List Tasks for current user (cross-workspace).

        Args:
            user_id: Current user ID
            my_role: Filter by role ('creator' or 'executor')
            last_exec_status: Filter by last execution status
            task_type: Filter by task type
            priority: Filter by priority
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (tasks, total_count)
        """
        return self.task_repo.get_my_tasks(
            user_id=user_id,
            my_role=my_role,
            last_exec_status=last_exec_status,
            task_type=task_type,
            priority=priority,
            page=page,
            page_size=page_size,
        )
