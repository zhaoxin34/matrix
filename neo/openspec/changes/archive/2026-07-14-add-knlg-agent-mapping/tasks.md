## 1. Database Migration

- [x] 1.1 创建 alembic migration `2026_07_14_003_add_knlg_agent_mapping.py`
  - 建表 `knlg_agent_mapping`（id / workspace_id / type / agent_id / created_at / updated_at）
  - 添加 `UNIQUE KEY uk_workspace_type (workspace_id, type)`（M1 + M2 一次性满足）
  - 添加 `INDEX idx_workspace_id (workspace_id)` 用于按 workspace 列全部
  - downgrade: 删表
- [x] 1.2 本地执行 `alembic upgrade head` 验证建表成功
- [x] 1.3 验证 UNIQUE 约束：尝试插入重复 (workspace_id, type) 必须报错

## 2. ORM Model

- [x] 2.1 创建 `backend/src/app/models/knlg_agent_mapping.py`
  - 类 `KnlgAgentMapping(Base)`，字段对应表结构
  - 使用 SQLAlchemy `Column()` 风格（与现有 agent.py 等 Model 保持一致）
  - docstring 描述用途
- [x] 2.2 在 `backend/src/app/models/__init__.py` 导出 `KnlgAgentMapping`

## 3. Pydantic Schema

- [x] 3.1 创建 `backend/src/app/schemas/knlg_agent_mapping.py`
  - `AgentMappingCreate`：包含 `type: str`、`agent_id: int`
  - `AgentMappingUpdate`：仅 `agent_id: int`（type 不可改）
  - `AgentMappingResponse`：返回完整字段
  - `AgentMappingListResponse`：items + total + page + page_size + total_pages
  - `type` 字段校验：pattern `^[a-z][a-z0-9_]*$`，长度 1-32
- [x] 3.2 在 `backend/src/app/schemas/__init__.py` 导出新 schema（按需 import，无需修改 __init__.py）

## 4. Repository

- [x] 4.1 创建 `backend/src/app/repositories/knlg_agent_mapping_repository.py`
  - 类 `KnlgAgentMappingRepository`，`__init__(self, db: Session)`
  - `create(workspace_id, type, agent_id) -> KnlgAgentMapping`
  - `get_by_id(mapping_id) -> KnlgAgentMapping | None`
  - `get_by_workspace_and_type(workspace_id, type) -> KnlgAgentMapping | None`
  - `list_by_workspace(workspace_id, page, page_size) -> tuple[list, int]`，按 `created_at DESC`
  - `update_agent_id(mapping, agent_id) -> KnlgAgentMapping`，更新 `updated_at`
  - `delete(mapping) -> None`
- [x] 4.2 在 `backend/src/app/repositories/__init__.py` 导出

## 5. Service

- [x] 5.1 创建 `backend/src/app/services/knlg_agent_mapping_service.py`
  - `list_mappings(workspace_id, page, page_size)`：调用 repo
  - `get_mapping(workspace_id, type)`：404 if not found
  - `create_mapping(workspace_id, type, agent_id)`
    - 校验 type 格式（Pydantic 已做，业务层兜底）
    - 校验 agent 存在 + 属于该 workspace + 未删除（404 if not）
    - 校验 (workspace_id, type) 唯一（409 if duplicate）
    - 调用 repo.create
  - `update_mapping_agent(workspace_id, type, new_agent_id)`：404 if not found / agent 校验同上
  - `delete_mapping(workspace_id, type)`：404 if not found
- [x] 5.2 在 `backend/src/app/services/__init__.py` 导出

## 6. API Endpoints

- [x] 6.1 创建 `backend/src/app/api/v1/agent_mapping.py`
  - router prefix `/workspaces/{workspace_code}/agent-mappings`，tags `["agent-mapping"]`
  - 复用 `_get_workspace_id(workspace_code, db)` 模式
  - 5 个端点：`GET ""`、`GET "/{type}"`、`POST ""`、`PUT "/{type}"`、`DELETE "/{type}"`
  - 所有端点 `Depends(get_current_user)`
  - 返回统一用 `ApiResponse.success(...)`，业务错误用 `BusinessException` → 自动转为 HTTP 状态码
- [x] 6.2 在 `backend/src/app/main.py` 注册新 router（项目实际在 main.py 注册，不是 router.py）

## 7. Unit Tests

- [x] 7.1 创建 `backend/tests/unit/test_knlg_agent_mapping_repository.py`
  - 覆盖：create / get_by_id / get_by_workspace_and_type / list_by_workspace / update_agent_id / delete
  - 覆盖 UNIQUE 约束冲突 (IntegrityError)
  - 13 个测试用例
- [x] 7.2 创建 `backend/tests/unit/test_knlg_agent_mapping_service.py`
  - 覆盖：成功创建 / agent 不存在 (404) / agent 跨 workspace (404) / type 重复 (409) / agent 已删除 (404)
  - 覆盖：更新成功 / 更新不存在 (404) / 更新为跨 workspace agent (404)
  - 覆盖：删除成功 / 删除不存在 (404)
  - 14 个测试用例
- [x] 7.3 运行 `pytest backend/tests/unit/test_knlg_agent_mapping_*.py` 全绿（27/27 通过）

## 8. Lint / Type / Format 校验

- [x] 8.1 运行 `uv run ruff format` 全部文件（7 files left unchanged）
- [x] 8.2 运行 `uv run ruff check` 全部新文件（All checks passed!）
- [x] 8.3 运行 `uv run mypy` 全部新文件（Success: no issues found in 5 source files）
- [x] 8.4 修复所有新增报错（无新增；唯一 lint error 在 test_agent_prototype_service.py:212，git stash 确认是预存的非本次改动引入）

## 9. 集成验证

- [x] 9.1 启动 backend (`make dev`)
- [x] 9.2 用 curl / httpie 走通完整 CRUD 流程：
  - 创建 mapping ✓
  - 列表查询 ✓
  - 按 type 查询 ✓
  - 更新 agent ✓
  - 删除 ✓
  - 验证 404 / 409 错误码正确 ✓（HTTP 404/409/422/401 全过）
- [x] 9.3 更新 `openspec/changes/add-knlg-agent-mapping/proposal.md` 里的"已实现"标记（如需要）

## 10. OpenSpec Archive 准备

- [x] 10.1 确认所有 artifacts（proposal / design / specs / tasks）齐全且通过 lint
- [x] 10.2 运行 `openspec validate add-knlg-agent-mapping` 无错误（"Change 'add-knlg-agent-mapping' is valid"）
- [ ] 10.3 （可选）等用户确认后调用 `openspec archive add-knlg-agent-mapping`
