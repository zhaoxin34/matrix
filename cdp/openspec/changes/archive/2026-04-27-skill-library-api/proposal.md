## Why

构建统一的技能库系统，用于集中存储和管理 AI 技能的 markdown 文档。当前技能文档分散各处，缺乏统一管理、无法有效搜索和复用。技能库是 AI Agent 调用技能的基础设施，需要提供完整的 CRUD、软删除和启用禁用功能。

## What Changes

- 新增 `skill` 数据库表，存储技能元数据和 markdown 内容
- 实现技能 CRUD API（创建、查询、更新、删除）
- 实现软删除功能（设置 `deleted_at`，不真正删除数据）
- 实现启用/禁用功能（`is_active` 状态控制）
- 支持按 `level`、`tags`、`is_active` 筛选技能列表
- 支持分页查询

## Capabilities

### New Capabilities

- `skill-crud`: 技能的创建、读取、更新、软删除 API
- `skill-activate`: 技能的启用/禁用状态管理 API
- `skill-list`: 技能列表查询，支持分页和多维度筛选

## Impact

- **数据库**: 新增 `skill` 表到 CDP MySQL 数据库
- **API**: 新增 `/api/v1/skills` REST API 端点
- **代码**: 新增 Model、Schema、Service、Repository、API Router
- **依赖**: 复用现有 CDP 后端框架 (FastAPI + SQLAlchemy)
