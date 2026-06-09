"""Task schema definitions."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class TaskType(str, Enum):
    """Task type enum."""

    TEMPORARY = "temporary"
    PERIODIC = "periodic"
    DISPATCH = "dispatch"


class TaskPriority(str, Enum):
    """Task priority enum."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    """Task status enum."""

    ENABLED = "enabled"
    DISABLED = "disabled"


class TaskExecStatus(str, Enum):
    """Task execution status enum."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class TaskRecordResponse(BaseModel):
    """Task record response schema."""

    id: int
    task_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None
    exec_status: str
    result: Optional[str] = None
    process: Optional[dict] = None
    failure_reason: Optional[str] = None
    recording_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskRecordListResponse(BaseModel):
    """Task record list response schema."""

    items: List[TaskRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TaskResponse(BaseModel):
    """Task response schema."""

    id: int
    name: str
    description: Optional[str] = None
    content: Optional[str] = None
    workspace_id: int
    agent_id: int
    creator_id: int
    creator_name: Optional[str] = None
    executor_id: int
    executor_name: Optional[str] = None
    priority: str
    task_type: str
    last_exec_status: str
    status: str
    max_retry: int
    retry_interval: int
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    cron_expression: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Task list response schema."""

    items: List[TaskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TaskCreate(BaseModel):
    """Task create schema."""

    name: str = Field(..., min_length=1, max_length=128, description="Task name")
    description: Optional[str] = Field(None, description="Task description")
    content: Optional[str] = Field(None, description="Task content/prompt")
    agent_id: int = Field(..., description="Agent ID to execute the task")
    executor_id: int = Field(..., description="Executor user ID (Agent Owner by default)")
    priority: TaskPriority = Field(TaskPriority.MEDIUM, description="Task priority")
    cron_expression: Optional[str] = Field(None, description="Cron expression for periodic tasks")
    max_retry: int = Field(3, ge=0, le=10, description="Max retry count")
    retry_interval: int = Field(60, ge=1, description="Retry interval in seconds")
    webhook_url: Optional[str] = Field(None, max_length=512, description="Webhook URL for completion notification")
    webhook_secret: Optional[str] = Field(None, max_length=128, description="Webhook secret for signature verification")


class TaskUpdate(BaseModel):
    """Task update schema."""

    name: Optional[str] = Field(None, min_length=1, max_length=128, description="Task name")
    description: Optional[str] = Field(None, description="Task description")
    content: Optional[str] = Field(None, description="Task content/prompt")
    agent_id: Optional[int] = Field(None, description="Agent ID to execute the task")
    priority: Optional[TaskPriority] = Field(None, description="Task priority")
    cron_expression: Optional[str] = Field(None, description="Cron expression for periodic tasks")
    max_retry: Optional[int] = Field(None, ge=0, le=10, description="Max retry count")
    retry_interval: Optional[int] = Field(None, ge=1, description="Retry interval in seconds")
    webhook_url: Optional[str] = Field(None, max_length=512, description="Webhook URL")
    webhook_secret: Optional[str] = Field(None, max_length=128, description="Webhook secret")


class TaskStatusResponse(BaseModel):
    """Task status response schema."""

    id: int
    status: str

    model_config = {"from_attributes": True}


class MyTaskResponse(BaseModel):
    """My task response schema for /api/v1/tasks/me endpoint."""

    id: int
    name: str
    description: Optional[str] = None
    task_type: str
    priority: str
    last_exec_status: str
    status: str
    agent_id: int
    agent_name: Optional[str] = None
    creator_id: int
    creator_name: Optional[str] = None
    executor_id: int
    executor_name: Optional[str] = None
    workspace_id: int
    workspace_code: str
    workspace_name: str
    my_role: str  # "creator" or "executor"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MyTaskListResponse(BaseModel):
    """My task list response schema."""

    items: List[MyTaskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
