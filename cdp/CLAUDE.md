# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

CDP（客户数据平台）- 一个用于客户数据管理和用户认证的 Web 应用，包含 React 前端和 FastAPI 后端。

## 目录结构

```
cdp/
├── frontend/          # React + TypeScript + Vite 前端
├── backend/           # Python FastAPI 后端
├── script/            # 启动脚本（Zellij 集成）
└── e2e-test-case/     # E2E 测试用例文档
```

## 规范

- 前后端API交互规范：./claude/rules/api-rule.md

## 常用命令

### 前端 (cdp/frontend)

```bash
make install      # npm install
make dev          # 启动开发服务器 (http://localhost:3001)
make build        # 生产环境构建
make lint         # 运行 ESLint
make format       # 使用 Prettier 格式化
make type-check   # TypeScript 类型检查
make test         # 运行 Vitest 测试
```

### 后端 (cdp/backend)

```bash
make install       # pip install -r requirements.txt
make dev           # 启动 FastAPI 开发服务器 (http://localhost:8001)
make test          # 运行 pytest 并生成覆盖率报告
make lint          # 运行 ruff 检查
make format        # 运行 ruff 格式化
make type-check    # 运行 mypy 类型检查
make migrate       # 运行 Alembic 数据库迁移
make migrate-gen MSG="描述"  # 生成新的迁移文件
```

### 启动前后端服务

```bash
cd cdp/script && ./start.sh  # 在 Zellij 浮动面板中启动前端和后端
```

## 架构设计

### 前端架构

- **框架**: React 18 + TypeScript + Vite
- **UI 库**: Ant Design 5.x（中文语言包）
- **状态管理**: Zustand（`src/stores/authStore.ts`）
- **路由**: React Router v6（通过 `GuestRoute` 实现路由保护）
- **API 客户端**: Axios，模块化组织（`src/api/modules/`）
- **表单处理**: React Hook Form + Zod 验证
- **样式**: LESS + CSS 变量（`src/styles/`）

### 后端架构

- **框架**: FastAPI + SQLAlchemy 2.0
- **数据库**: MySQL（Alembic 迁移管理）
- **认证**: JWT（access token + refresh token）
- **密码加密**: bcrypt（通过 passlib 实现）

**分层结构**（`backend/src/app/`）：

```
api/v1/          # 路由处理器（auth.py, health.py）
services/        # 业务逻辑层（auth_service.py）
repositories/    # 数据访问层（user_repo.py）
models/          # SQLAlchemy 模型（user.py）
schemas/         # Pydantic 请求/响应模型（auth.py）
core/            # 核心工具（security.py）
```

**API 端点**：

- `GET /health` - 健康检查

### 数据流向

1. 前端表单通过 Axios 提交到 API
2. API 路由（`api/v1/auth.py`）委托给 services 层
3. Services 处理业务逻辑并调用 repositories
4. Repositories 与 SQLAlchemy models 交互
5. 响应通过相同层级返回

## 配置说明

### 后端环境配置

- 数据库: MySQL，地址 `127.0.0.1:3306/cdp`（用户名: root，密码: root）
- 后端运行端口: `8001`

### 前端 API 配置

- 后端 API 地址通过环境变量配置
- Token 存储在 Zustand store 和 localStorage 中
