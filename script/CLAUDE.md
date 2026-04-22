# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

电商演示平台，基于 React + TypeScript 前端和 Python FastAPI 后端构建。用于 AI 智能体研究和学习的环境。

## 项目结构

```
ecommerce/
├── backend/              # Python FastAPI 后端
│   ├── src/app/         # 应用代码
│   │   ├── api/v1/      # API 路由处理
│   │   ├── core/        # 安全、异常、限流
│   │   ├── models/      # SQLAlchemy 模型
│   │   ├── repositories/# 数据访问层
│   │   ├── schemas/     # Pydantic schema
│   │   ├── services/    # 业务逻辑层
│   │   └── main.py      # FastAPI 入口
│   ├── alembic/         # 数据库迁移
│   ├── tests/           # pytest 测试
│   └── Makefile         # 后端命令
└── frontend/            # React TypeScript 前端
    ├── src/
    │   ├── api/         # Axios 客户端和 API 模块
    │   ├── components/  # 可复用 UI 组件
    │   ├── hooks/       # 自定义 React Hooks
    │   ├── pages/       # 页面组件
    │   ├── stores/      # Zustand 状态管理
    │   └── types/       # TypeScript 类型定义
    └── Makefile         # 前端命令
```

## 开发命令

### 前端 (`cd frontend && make <target>`)
- `make dev` - 启动 Vite 开发服务器（端口 3000，/api 代理到后端）
- `make build` - 生产环境构建
- `make lint` - 运行 ESLint
- `make format` - 使用 Prettier 格式化
- `make type-check` - 运行 TypeScript 类型检查
- `make test` - 运行 Vitest 测试

### 后端 (`cd backend && make <target>`)
- `make dev` - 启动 uvicorn 开发服务器（端口 8000）
- `make test` - 运行 pytest（带覆盖率）
- `make lint` - 运行 ruff 检查
- `make format` - 使用 ruff 格式化
- `make type-check` - 运行 mypy 类型检查
- `make migrate` - 运行 Alembic 数据库迁移
- `make migrate-gen MSG="描述"` - 生成新迁移
- `make seed` - 填充示例数据

## 架构

### 前端架构
- **路由**: React Router v6，嵌套路由于 `MainLayout`
- **状态管理**: Zustand stores（`authStore`、`cartStore`、`uiStore`）
- **API 层**: Axios 客户端，带 JWT token 注入拦截器
- **表单**: React Hook Form + Zod 验证
- **UI 框架**: Ant Design 组件（中文 locale）
- **路径别名**: `@/` 映射到 `src/`

### 后端架构
```
API 层 (app/api/v1/) → Service 层 → Repository 层 → 数据库
```
- **认证**: JWT Bearer token，通过 `python-jose` 处理
- **依赖注入**: FastAPI `Depends()` + 自定义 `dependencies.py`
- **数据库**: MySQL + SQLAlchemy ORM
- **迁移**: Alembic 支持自动生成
- **限流**: slowapi 中间件

### 核心 API 端点
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录（返回 JWT）
- `GET /api/v1/users/me` - 获取当前用户（需认证）
- `GET /api/v1/products` - 商品列表
- `GET /api/v1/categories` - 分类列表
- `GET/POST /api/v1/cart/items` - 购物车操作
- `GET/POST /api/v1/orders` - 订单操作
- `GET /api/v1/addresses` - 用户地址

## 测试用户
- 用户名: `13800138002`
- 密码: `abcd1234`

## 环境变量
- 后端: `backend/.env`（从 `.env.example` 复制）
- 前端: `VITE_API_BASE_URL` 默认为 `http://localhost:8000/api/v1`

## 重要说明
- 后端使用 `PYTHONPATH=src` 以支持 `app` 模块导入
- 前端 Vite 开发服务器将 `/api` 请求代理到 `http://localhost:8000`
- JWT token 存储在 Zustand `authStore` 中，通过 Axios 拦截器注入
- 受保护路由使用 `get_current_user` 依赖，token 过期/无效时返回 401
