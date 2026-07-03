## Why

knlg-base（知识库与问答库）子系统是 Neo 平台把专家隐性经验沉淀为 AI 可用决策记忆的核心模块。技术设计文档（P0 阶段：数据库 schema、后端 API、前端模块拆分）已完成审查与一致性修正（统一 `knlg_` 表名前缀、消除路径重复、修正前端目录结构、角色命名对齐），具备进入开发状态的基础。本变更启动 **P0 CRUD 范围**的实现，覆盖知识卡片、问答库、规则库、知识导入、访谈会话五类核心实体的基础增删改查，**不涉及 AI 调用**（LLM Gateway / Prompt 管理 / 访谈 Agent 状态机属于 P1+，待后续变更启动）。

## What Changes

- 新增 **knlg-base 后端模块**（`backend/src/app/{api,models,schemas,services,repositories}/knlg_base/`），实现 17 张表的 CRUD API，遵循 Neo 平台分层架构（api → service → repository → model）
- 新增 **Alembic 迁移脚本**，创建 `knlg_*` 17 张业务表 + 索引 + 外键约束
- 新增 **前端 knlg-base 路由组**（`frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/`），实现 P0 范围 18 个页面（首页 + 问答库 5 + 知识库 6 + 规则库 5 + 知识导入 3）
- 新增 **前端业务模块代码**（`frontend/src/{components,hooks,lib}/knlg-base/`），封装列表/详情/编辑表单 + TanStack Query hooks + Zod schemas
- 注册新路由到后端 `main.py`（`app.include_router(knlg_base.router, prefix="/api/v1/workspaces/{workspace_code}/knlg-base")`）
- **不包含**：AI 调用、LLM Gateway、Prompt 管理、访谈 Agent 状态机、文档解析、规则触发、规则版本对比、候选知识审核（这些属于 P1+ 后续变更）

## Capabilities

### New Capabilities

- `knowledge-base`: 知识库 CRUD（P0 范围）—— 知识卡片（`knlg_knowledge_card`）的创建、列表、详情、编辑、删除、状态变更（draft/reviewing/published/deprecated）；不含版本对比与候选知识审核
- `qa-library`: 问答库 CRUD（P0 范围）—— 问题树模板（`knlg_question_tree`）、问题（`knlg_question`）、访谈会话（`knlg_interview_session`）、访谈（`knlg_interview`）、问答（`knlg_interview_turn`）的增删改查；不含 AI 访谈 Agent 实时交互
- `rule-library`: 规则库 CRUD（P0 范围）—— 规则（`knlg_rule`）的创建、列表、详情、编辑、删除、状态变更（draft/testing/active/paused/deprecated）；不含规则触发、规则验证、规则执行日志
- `knowledge-import`: 知识导入 CRUD（P0 范围）—— 源文档（`knlg_document`）的上传记录、导入任务（`knlg_import_job`）的创建与状态查询；**仅 CRUD，不触发实际解析**（解析属于 P2 文档解析器）
- `knlg-base-home`: knlg-base 首页（统计概览入口）—— P0 阶段首页只展示子模块导航（问答库/知识库/规则库/知识导入），不做真实统计聚合

### Modified Capabilities

（无现有 spec 的 REQUIREMENTS 变更）

## Impact

### 受影响的代码/模块

**后端新增**：

- `backend/src/app/models/` 下新增 17 个 SQLAlchemy model 文件（knlg_question_tree, knlg_question, knlg_interview_session, knlg_interview, knlg_interview_turn, knlg_interview_turn_ref, knlg_knowledge_card, knlg_source_ref, knlg_knowledge_card_version, knlg_document, knlg_import_job, knlg_parsed_chunk, knlg_candidate_kc, knlg_rule, knlg_evidence, knlg_rule_execution, knlg_llm_provider, knlg_llm_model, knlg_llm_prompt）
- `backend/src/app/api/v1/knlg_base.py`（P0 实际只导入部分子模块）
- `backend/src/app/services/` 下 5 个 service 模块
- `backend/src/app/repositories/` 下 5 个 repository 模块
- `backend/src/app/schemas/` 下 Pydantic schema

**后端修改**：

- `backend/src/app/main.py`：注册新 router（1 行 include_router）
- `backend/alembic/versions/`：新增迁移脚本

**前端新增**：

- `frontend/src/app/(main)/workspace/[workspace_code]/knlg-base/` 下 18 个页面文件
- `frontend/src/components/knlg-base/`：5+ 个共用组件
- `frontend/src/hooks/knlg-base/`：10+ 个 TanStack Query hooks
- `frontend/src/lib/knlg-base/api/`：5 个 API 客户端模块

**数据库**：

- MySQL 新增 17 张 `knlg_*` 表 + 索引 + 外键

### 依赖

- ✅ Neo 平台 Workspace 模块（已稳定，提供多租户隔离）
- ✅ Neo 平台 User 模块（已稳定，knlg-base 引用 `users.id`）
- ✅ Neo 平台认证/JWT 中间件（已稳定）
- ✅ Neo 平台 API 响应格式规范（已稳定）
- ❌ LLM Gateway（不在本变更范围）
- ❌ Celery 异步任务（不在本变更范围）

### 不影响

- 现有 17 个模块的代码、API、数据
- Agent Steer 模块
- Workspace 管理后台
- 现有路由表（之前已补充 knlg-base 路由）

### 文档前置依赖（已完成）

- ✅ `design/docs/technical/knlg-base/01-database-schema.md`（数据库 schema）
- ✅ `design/docs/technical/knlg-base/02-backend-api.md`（后端 API 设计）
- ✅ `design/docs/technical/knlg-base/03-frontend-modules.md`（前端模块拆分）
- ✅ `design/docs/product/overview/routing-table.md`（v1.6.0 已添加 knlg-base 路由）
- ✅ `design/docs/product/knlg-base/`（6 份产品文档完整）
