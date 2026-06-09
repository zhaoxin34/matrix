"""Task repository for database operations."""

from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskRecord


class TaskRepository:
    """Repository for Task database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, task: Task) -> Task:
        """Create a new Task."""
        self.db.add(task)
        self.db.flush()
        self.db.refresh(task)
        return task

    def get_by_id(self, task_id: int) -> Optional[Task]:
        """Get a Task by ID."""
        stmt = select(Task).where(Task.id == task_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def list_tasks(
        self,
        workspace_id: int,
        last_exec_status: Optional[str] = None,
        task_type: Optional[str] = None,
        priority: Optional[str] = None,
        agent_id: Optional[int] = None,
        creator_id: Optional[int] = None,
        executor_id: Optional[int] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Task], int]:
        """List Tasks with filters and pagination.

        Args:
            workspace_id: Filter by workspace
            last_exec_status: Filter by last execution status
            task_type: Filter by task type
            priority: Filter by priority
            agent_id: Filter by agent
            creator_id: Filter by creator
            executor_id: Filter by executor
            search: Search in name/description
            page: Page number (1-based)
            page_size: Items per page

        Returns:
            Tuple of (tasks, total_count)
        """
        stmt = select(Task).where(Task.workspace_id == workspace_id)

        # Filter by last_exec_status
        if last_exec_status:
            stmt = stmt.where(Task.last_exec_status == last_exec_status)

        # Filter by task_type
        if task_type:
            stmt = stmt.where(Task.task_type == task_type)

        # Filter by priority
        if priority:
            stmt = stmt.where(Task.priority == priority)

        # Filter by agent_id
        if agent_id is not None:
            stmt = stmt.where(Task.agent_id == agent_id)

        # Filter by creator_id
        if creator_id is not None:
            stmt = stmt.where(Task.creator_id == creator_id)

        # Filter by executor_id
        if executor_id is not None:
            stmt = stmt.where(Task.executor_id == executor_id)

        # Search in name and description
        if search:
            search_pattern = f"%{search}%"
            # Try to parse as ID if search is numeric
            try:
                search_id = int(search)
                stmt = stmt.where(
                    or_(
                        Task.name.ilike(search_pattern),
                        Task.id == search_id,
                    )
                )
            except ValueError:
                stmt = stmt.where(
                    or_(
                        Task.name.ilike(search_pattern),
                    )
                )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate and order
        stmt = stmt.order_by(Task.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        tasks = list(result.scalars().all())

        return tasks, total

    def update(self, task: Task, data: dict) -> Task:
        """Update a Task with data dictionary.

        Args:
            task: Task instance to update
            data: Dictionary of fields to update

        Returns:
            Updated Task
        """
        # Fields that cannot be modified
        forbidden_fields = {
            "id",
            "workspace_id",
            "creator_id",
            "executor_id",
            "task_type",
            "created_at",
        }

        for field, value in data.items():
            if field not in forbidden_fields and hasattr(task, field):
                setattr(task, field, value)

        task.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(task)
        return task

    def update_status(self, task: Task, status: str) -> Task:
        """Update Task status.

        Args:
            task: Task instance
            status: New status (enabled/disabled)

        Returns:
            Updated Task
        """
        task.status = status
        task.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(task)
        return task

    def update_exec_status(self, task: Task, exec_status: str) -> Task:
        """Update Task last_exec_status.

        Args:
            task: Task instance
            exec_status: New execution status

        Returns:
            Updated Task
        """
        task.last_exec_status = exec_status
        task.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(task)
        return task

    def delete(self, task: Task) -> None:
        """Delete a Task.

        Args:
            task: Task instance to delete
        """
        self.db.delete(task)
        self.db.flush()

    def has_records(self, task_id: int) -> bool:
        """Check if a Task has execution records.

        Args:
            task_id: Task ID

        Returns:
            True if has records, False otherwise
        """
        stmt = select(func.count(TaskRecord.id)).where(TaskRecord.task_id == task_id)
        count = self.db.execute(stmt).scalar_one()
        return count > 0

    def count_records(self, task_id: int) -> int:
        """Count execution records for a Task.

        Args:
            task_id: Task ID

        Returns:
            Number of records
        """
        stmt = select(func.count(TaskRecord.id)).where(TaskRecord.task_id == task_id)
        return self.db.execute(stmt).scalar_one()

    def get_my_tasks(
        self,
        user_id: int,
        my_role: Optional[str] = None,
        last_exec_status: Optional[str] = None,
        task_type: Optional[str] = None,
        priority: Optional[str] = None,
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
            page: Page number (1-based)
            page_size: Items per page

        Returns:
            Tuple of (tasks, total_count)
        """
        if my_role == "creator":
            stmt = select(Task).where(Task.creator_id == user_id)
        elif my_role == "executor":
            stmt = select(Task).where(Task.executor_id == user_id)
        else:
            stmt = select(Task).where(or_(Task.creator_id == user_id, Task.executor_id == user_id))

        # Filter by last_exec_status
        if last_exec_status:
            stmt = stmt.where(Task.last_exec_status == last_exec_status)

        # Filter by task_type
        if task_type:
            stmt = stmt.where(Task.task_type == task_type)

        # Filter by priority
        if priority:
            stmt = stmt.where(Task.priority == priority)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate and order
        stmt = stmt.order_by(Task.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        tasks = list(result.scalars().all())

        return tasks, total


class TaskRecordRepository:
    """Repository for TaskRecord database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, record: TaskRecord) -> TaskRecord:
        """Create a new TaskRecord."""
        self.db.add(record)
        self.db.flush()
        self.db.refresh(record)
        return record

    def get_by_id(self, record_id: int) -> Optional[TaskRecord]:
        """Get a TaskRecord by ID."""
        stmt = select(TaskRecord).where(TaskRecord.id == record_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def list_by_task(
        self,
        task_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[TaskRecord], int]:
        """List TaskRecords for a task with pagination.

        Args:
            task_id: Filter by task
            page: Page number (1-based)
            page_size: Items per page

        Returns:
            Tuple of (records, total_count)
        """
        stmt = select(TaskRecord).where(TaskRecord.task_id == task_id)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate and order
        stmt = stmt.order_by(TaskRecord.started_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        records = list(result.scalars().all())

        return records, total

    def get_recent_by_task(self, task_id: int, limit: int = 10) -> list[TaskRecord]:
        """Get recent TaskRecords for a task.

        Args:
            task_id: Task ID
            limit: Maximum number of records

        Returns:
            List of recent TaskRecords
        """
        stmt = (
            select(TaskRecord).where(TaskRecord.task_id == task_id).order_by(TaskRecord.started_at.desc()).limit(limit)
        )
        result = self.db.execute(stmt)
        return list(result.scalars().all())
