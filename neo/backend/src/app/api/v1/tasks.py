"""Task API routes."""

from typing import Optional

from fastapi import APIRouter, Body, Depends, Path, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.response import ApiResponse
from app.schemas.task import (
    TaskCreate,
    TaskListResponse,
    TaskRecordListResponse,
    TaskRecordResponse,
    TaskResponse,
    TaskStatusResponse,
    TaskUpdate,
)
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Task"])


def get_service(db: Session = Depends(get_db)) -> TaskService:
    """Get Task service."""
    return TaskService(db)


@router.get("", response_model=ApiResponse[TaskListResponse])
def list_tasks(
    workspace_code: str = Path(..., description="Workspace code"),
    service: TaskService = Depends(get_service),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    last_exec_status: Optional[str] = Query(None, description="Filter by last execution status"),
    task_type: Optional[str] = Query(None, description="Filter by task type"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    agent_id: Optional[int] = Query(None, description="Filter by agent ID"),
    creator_id: Optional[int] = Query(None, description="Filter by creator ID"),
    executor_id: Optional[int] = Query(None, description="Filter by executor ID"),
    search: Optional[str] = Query(None, max_length=100, description="Search in name/ID"),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[TaskListResponse]:
    """List all Tasks in a workspace with pagination and filters."""
    tasks, total = service.list_tasks(
        workspace_code=workspace_code,
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

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ApiResponse.success(
        TaskListResponse(
            items=[TaskResponse.model_validate(t) for t in tasks],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("", response_model=ApiResponse[TaskResponse])
def create_task(
    workspace_code: str = Path(..., description="Workspace code"),
    data: TaskCreate = Body(...),
    service: TaskService = Depends(get_service),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[TaskResponse]:
    """Create a new periodic Task."""
    task = service.create_task(
        workspace_code=workspace_code,
        data=data.model_dump(),
        user_id=current_user.id,
    )
    return ApiResponse.success(TaskResponse.model_validate(task))


@router.get("/{task_id}", response_model=ApiResponse[TaskResponse])
def get_task(
    workspace_code: str = Path(..., description="Workspace code"),
    task_id: int = Path(..., description="Task ID"),
    service: TaskService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[TaskResponse]:
    """Get a Task by ID."""
    task = service.get_task(workspace_code=workspace_code, task_id=task_id)
    return ApiResponse.success(TaskResponse.model_validate(task))


@router.put("/{task_id}", response_model=ApiResponse[TaskResponse])
def update_task(
    workspace_code: str = Path(..., description="Workspace code"),
    task_id: int = Path(..., description="Task ID"),
    data: TaskUpdate = Body(...),
    service: TaskService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[TaskResponse]:
    """Update a periodic Task."""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    task = service.update_task(workspace_code=workspace_code, task_id=task_id, data=update_data)
    return ApiResponse.success(TaskResponse.model_validate(task))


@router.delete("/{task_id}", response_model=ApiResponse[dict])
def delete_task(
    workspace_code: str = Path(..., description="Workspace code"),
    task_id: int = Path(..., description="Task ID"),
    service: TaskService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Delete a periodic Task (only if no execution records exist)."""
    service.delete_task(workspace_code=workspace_code, task_id=task_id)
    return ApiResponse.success({"message": "Task deleted successfully"})


@router.post("/{task_id}/cancel", response_model=ApiResponse[TaskResponse])
def cancel_task(
    workspace_code: str = Path(..., description="Workspace code"),
    task_id: int = Path(..., description="Task ID"),
    service: TaskService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[TaskResponse]:
    """Cancel a Task."""
    task = service.cancel_task(workspace_code=workspace_code, task_id=task_id)
    return ApiResponse.success(TaskResponse.model_validate(task))


@router.patch("/{task_id}/disable", response_model=ApiResponse[TaskStatusResponse])
def disable_task(
    workspace_code: str = Path(..., description="Workspace code"),
    task_id: int = Path(..., description="Task ID"),
    service: TaskService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[TaskStatusResponse]:
    """Disable a Task."""
    task = service.disable_task(workspace_code=workspace_code, task_id=task_id)
    return ApiResponse.success(TaskStatusResponse.model_validate(task))


@router.patch("/{task_id}/enable", response_model=ApiResponse[TaskStatusResponse])
def enable_task(
    workspace_code: str = Path(..., description="Workspace code"),
    task_id: int = Path(..., description="Task ID"),
    service: TaskService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[TaskStatusResponse]:
    """Enable a Task."""
    task = service.enable_task(workspace_code=workspace_code, task_id=task_id)
    return ApiResponse.success(TaskStatusResponse.model_validate(task))


@router.get("/{task_id}/records", response_model=ApiResponse[TaskRecordListResponse])
def list_task_records(
    workspace_code: str = Path(..., description="Workspace code"),
    task_id: int = Path(..., description="Task ID"),
    service: TaskService = Depends(get_service),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[TaskRecordListResponse]:
    """List execution records for a Task."""
    records, total = service.list_task_records(
        workspace_code=workspace_code,
        task_id=task_id,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ApiResponse.success(
        TaskRecordListResponse(
            items=[TaskRecordResponse.model_validate(r) for r in records],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.get("/{task_id}/records/{record_id}", response_model=ApiResponse[TaskRecordResponse])
def get_task_record(
    workspace_code: str = Path(..., description="Workspace code"),
    task_id: int = Path(..., description="Task ID"),
    record_id: int = Path(..., description="Record ID"),
    service: TaskService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[TaskRecordResponse]:
    """Get a specific execution record."""
    record = service.get_task_record(workspace_code=workspace_code, task_id=task_id, record_id=record_id)
    return ApiResponse.success(TaskRecordResponse.model_validate(record))
