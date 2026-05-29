## Context

嵌入网站（EmbeddedSite）管理功能是 Agent 系统的数据基础，允许 AI Agent 学习和操作外部网站系统。

**当前状态**：
- 产品设计已存在于 `design/docs/product/workspaces/embedded-site.md`
- 技术设计已存在于 `design/docs/technical/workspaces/embedded-site.md`
- UI 原型已实现于 `ui/` 和 `frontend/` 项目
- 数据库表结构已设计完成

**约束**：
- 后端使用 Python FastAPI
- 前端使用 Next.js + React + TypeScript
- 数据库使用 MySQL
- 需要遵循现有 API 规范

## Goals / Non-Goals

**Goals:**
- 实现 EmbeddedSite 完整的 CRUD API
- 实现前端列表页、创建页、编辑页
- 支持状态切换（启用/禁用）
- 提供分页、搜索、过滤功能

**Non-Goals:**
- Agent 嵌入功能（独立功能）
- 网站可访问性自动验证
- 批量操作

## Decisions

### 1. API 路由设计

**决策**: 使用 `/api/v1/workspaces/{workspace_code}/embedded-sites` 作为资源路径

**理由**:
- 遵循 RESTful 最佳实践，资源嵌套在 Workspace 下
- 使用 workspace_code 而非 workspace_id，便于前端调用
- 保持与其他 Workspace 资源的一致性

### 2. 数据模型

**决策**: 软删除 + 状态机管理

**理由**:
- 保留历史数据便于审计和回溯
- enabled/disabled 状态明确区分可用性
- created_by 字段支持权限校验

### 3. 前端路由结构

**决策**: `/workspace/{workspace_code}/embedded-sites`

**理由**:
- 与设计文档保持一致
- 语义清晰，表示工作区下的嵌入网站管理
- 便于扩展子路由（new, edit 等）

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| URL 验证可能导致创建延迟 | 用户体验 | 异步验证或可选验证 |
| 并发创建同名站点 | 数据一致性 | 数据库唯一约束 |
| 删除时存在关联 Agent | 业务限制 | 返回明确错误信息 |
| 大量站点影响列表性能 | 可扩展性 | 数据库索引 + 分页 |