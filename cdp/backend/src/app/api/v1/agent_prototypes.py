"""Agent Prototype API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_database
from app.models.agent_prototype import AgentPrototypeStatus as ModelAgentPrototypeStatus
from app.models.user import User
from app.schemas.agent_prototype import (
    AgentPrototypeCreate,
    AgentPrototypeListResponse,
    AgentPrototypePromptCreate,
    AgentPrototypePromptListResponse,
    AgentPrototypePromptResponse,
    AgentPrototypePromptUpdate,
    AgentPrototypePublish,
    AgentPrototypeResponse,
    AgentPrototypeRollback,
    AgentPrototypeUpdate,
    AgentPrototypeVersionListResponse,
    AgentPrototypeVersionResponse,
)
from app.schemas.response import ApiResponse
from app.services.agent_prototype_service import AgentPrototypePromptService, AgentPrototypeService

router = APIRouter(prefix="/agent-prototypes", tags=["Agent原型管理"])


def get_prototype_service(db: Session = Depends(get_database)) -> AgentPrototypeService:
    return AgentPrototypeService(db)


def get_prompt_service(db: Session = Depends(get_database)) -> AgentPrototypePromptService:
    return AgentPrototypePromptService(db)


# =============================================================================
# Agent Prototype CRUD
# =============================================================================


@router.post("", response_model=ApiResponse[AgentPrototypeResponse])
def create_prototype(
    data: AgentPrototypeCreate,
    service: AgentPrototypeService = Depends(get_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """创建新Agent原型"""
    prototype = service.create_prototype(data, current_user.id)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.get("", response_model=ApiResponse[AgentPrototypeListResponse])
def list_prototypes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    service: AgentPrototypeService = Depends(get_prototype_service),
):
    """获取Agent原型列表"""
    status_enum = ModelAgentPrototypeStatus(status) if status else None
    items, total = service.list_prototypes(page=page, page_size=page_size, status=status_enum)
    return ApiResponse.success(
        AgentPrototypeListResponse(
            items=[AgentPrototypeResponse.model_validate(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{prototype_id}", response_model=ApiResponse[AgentPrototypeResponse])
def get_prototype(
    prototype_id: str,
    service: AgentPrototypeService = Depends(get_prototype_service),
):
    """获取Agent原型详情"""
    prototype = service.get_prototype(prototype_id)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.put("/{prototype_id}", response_model=ApiResponse[AgentPrototypeResponse])
def update_prototype(
    prototype_id: str,
    data: AgentPrototypeUpdate,
    service: AgentPrototypeService = Depends(get_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """更新Agent原型"""
    prototype = service.update_prototype(prototype_id, data, current_user.id)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.delete("/{prototype_id}")
def delete_prototype(
    prototype_id: str,
    service: AgentPrototypeService = Depends(get_prototype_service),
):
    """删除Agent原型（仅draft状态）"""
    service.delete_prototype(prototype_id)
    return ApiResponse.success({"message": "原型已删除"})


# =============================================================================
# Publish & Rollback
# =============================================================================


@router.post("/{prototype_id}/publish", response_model=ApiResponse[AgentPrototypeVersionResponse])
def publish_prototype(
    prototype_id: str,
    data: AgentPrototypePublish,
    service: AgentPrototypeService = Depends(get_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """发布新版本"""
    version = service.publish_prototype(prototype_id, data, current_user.id)
    return ApiResponse.success(AgentPrototypeVersionResponse.model_validate(version))


@router.get("/{prototype_id}/versions", response_model=ApiResponse[AgentPrototypeVersionListResponse])
def get_version_history(
    prototype_id: str,
    service: AgentPrototypeService = Depends(get_prototype_service),
):
    """获取版本历史"""
    versions = service.get_version_history(prototype_id)
    return ApiResponse.success(
        AgentPrototypeVersionListResponse(
            items=[AgentPrototypeVersionResponse.model_validate(v) for v in versions],
            total=len(versions),
        )
    )


@router.post("/{prototype_id}/rollback", response_model=ApiResponse[AgentPrototypeResponse])
def rollback_prototype(
    prototype_id: str,
    data: AgentPrototypeRollback,
    service: AgentPrototypeService = Depends(get_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """回滚到指定版本"""
    prototype = service.rollback_prototype(prototype_id, data, current_user.id)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


# =============================================================================
# Agent Prototype Prompt CRUD
# =============================================================================


prompt_router = APIRouter(prefix="/agent-prototype-prompts", tags=["Agent原型Prompt管理"])


@prompt_router.get("", response_model=ApiResponse[AgentPrototypePromptListResponse])
def list_prompts(
    prototype_id: str = Query(..., description="原型ID"),
    service: AgentPrototypePromptService = Depends(get_prompt_service),
):
    """获取原型的所有Prompts"""
    prompts = service.list_prompts(prototype_id)
    return ApiResponse.success(
        AgentPrototypePromptListResponse(
            items=[AgentPrototypePromptResponse.model_validate(p) for p in prompts],
            total=len(prompts),
        )
    )


@prompt_router.post("", response_model=ApiResponse[AgentPrototypePromptResponse])
def create_prompt(
    data: AgentPrototypePromptCreate,
    service: AgentPrototypePromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_user),
):
    """创建Prompt"""
    prompt = service.create_prompt(data, current_user.id)
    return ApiResponse.success(AgentPrototypePromptResponse.model_validate(prompt))


@prompt_router.get("/{prompt_id}", response_model=ApiResponse[AgentPrototypePromptResponse])
def get_prompt(
    prompt_id: str,
    service: AgentPrototypePromptService = Depends(get_prompt_service),
):
    """获取Prompt详情"""
    prompt = service.get_prompt(prompt_id)
    return ApiResponse.success(AgentPrototypePromptResponse.model_validate(prompt))


@prompt_router.put("/{prompt_id}", response_model=ApiResponse[AgentPrototypePromptResponse])
def update_prompt(
    prompt_id: str,
    data: AgentPrototypePromptUpdate,
    service: AgentPrototypePromptService = Depends(get_prompt_service),
    current_user: User = Depends(get_current_user),
):
    """更新Prompt"""
    prompt = service.update_prompt(prompt_id, data, current_user.id)
    return ApiResponse.success(AgentPrototypePromptResponse.model_validate(prompt))


@prompt_router.delete("/{prompt_id}")
def delete_prompt(
    prompt_id: str,
    service: AgentPrototypePromptService = Depends(get_prompt_service),
):
    """删除Prompt"""
    service.delete_prompt(prompt_id)
    return ApiResponse.success({"message": "Prompt已删除"})
