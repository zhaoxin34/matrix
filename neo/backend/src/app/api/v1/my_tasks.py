"""My Tasks API routes - cross-workspace task view."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.response import ApiResponse
from app.schemas.task import MyTaskListResponse, MyTaskResponse
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["My Tasks"])


def get_service(db: Session = Depends(get_db)) -> TaskService:
    """Get Task service."""
    return TaskService(db)


@router.get("/me", response_model=ApiResponse[MyTaskListResponse])
def get_my_tasks(
    service: TaskService = Depends(get_service),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    my_role: str | None = Query(None, description="Filter by role: 'creator' or 'executor'"),
    last_exec_status: str | None = Query(None, description="Filter by last execution status"),
    task_type: str | None = Query(None, description="Filter by task type"),
    priority: str | None = Query(None, description="Filter by priority"),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[MyTaskListResponse]:
    """Get my tasks (cross-workspace view).

    Returns tasks where current user is either creator or executor.
    """
    tasks, total = service.get_my_tasks(
        user_id=current_user.id,
        my_role=my_role,
        last_exec_status=last_exec_status,
        task_type=task_type,
        priority=priority,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    # Build response with workspace info and my_role
    items = []
    for task in tasks:
        # Determine my_role for this task
        if task.creator_id == current_user.id:
            role = "creator"
        else:
            role = "executor"

        items.append(
            MyTaskResponse(
                id=task.id,
                name=task.name,
                description=task.description,
                task_type=task.task_type,
                priority=task.priority,
                last_exec_status=task.last_exec_status,
                status=task.status,
                agent_id=task.agent_id,
                agent_name=task.agent.name if task.agent else None,
                creator_id=task.creator_id,
                creator_name=task.creator.username if task.creator else None,
                executor_id=task.executor_id,
                executor_name=task.executor.username if task.executor else None,
                workspace_id=task.workspace_id,
                workspace_code=task.workspace.code if task.workspace else None,
                workspace_name=task.workspace.name if task.workspace else None,
                my_role=role,
                created_at=task.created_at,
                updated_at=task.updated_at,
            ),
        )

    return ApiResponse.success(
        MyTaskListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )
