## Why

嵌入网站管理功能允许 AI Agent 学习和操作外部网站，是 Agent 智能化的基础能力。通过结构化管理网站配置，Agent 能够理解网站结构并执行自动化操作。

## What Changes

- **后端 API**: 实现 `embedded-site` 实体完整的 CRUD 接口（创建、查询、更新、删除）
- **前端页面**: 开发列表页、创建页、编辑页三个 UI 页面
- **状态管理**: 支持启用/禁用状态切换
- **关联能力**: 为 Agent 嵌入系统提供数据基础

## Capabilities

### New Capabilities

- `embedded-site-api`: 后端 RESTful API，包含列表、创建、更新、删除、状态切换等接口
- `embedded-site-frontend`: 前端页面，包括列表页、创建页、编辑页，以及相关组件

### Modified Capabilities

无

## Impact

- **backend**: 新增 `/api/v1/embedded-sites` 相关路由和服务
- **frontend/ui**: 高保真原型项目新增 `/workspace/{workspace_code}/embedded-sites` 路由
- **frontend**: 前端项目同步实现相同功能
- **数据库**: 新增 `embedded_sites` 表及关联索引