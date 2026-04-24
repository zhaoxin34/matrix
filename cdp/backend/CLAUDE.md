# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CDP 后端是基于 FastAPI + SQLAlchemy 的 Python Web API 项目，使用 MySQL 数据库和 Alembic 进行数据库迁移管理，使用 uv 作为包管理器。

## 常用命令

```bash
# 安装依赖
make install

# 启动开发服务器 (http://localhost:8001)
make dev

# 运行测试
make test

# 单个测试文件
PYTHONPATH=src uv run pytest tests/services/test_project_service.py -v

# 代码检查和格式化
make lint
make format

# 类型检查
make type-check

# 数据库迁移
make migrate
make migrate-gen MSG="描述"  # 生成新迁移
```

## 架构设计

### 分层结构

```
src/app/
├── api/v1/          # 路由处理器 (auth.py, projects.py, employees.py 等)
├── services/        # 业务逻辑层 (project_service.py, employee_service.py)
├── repositories/    # 数据访问层 (project_repo.py, user_repo.py)
├── models/          # SQLAlchemy 模型 (user.py, project.py, employee.py)
├── schemas/         # Pydantic 请求/响应模型
├── core/            # 核心工具 (security.py, error_codes.py, exceptions.py)
├── middleware/      # 中间件 (logging_middleware.py)
└── database.py      # 数据库连接配置
```

### API 响应格式

所有 API 返回统一格式 (`app/schemas/response.py`):

```python
ApiResponse.success(data)  # 成功响应
ApiResponse.error(code, message)  # 错误响应
```

响应结构:
```json
{"code": 0, "message": "ok", "data": {...}, "traceId": "...", "timestamp": 1234567890}
```

### 错误码体系 (`app/core/error_codes.py`)

| 范围 | 用途 |
|------|------|
| 0 | 成功 |
| 1000-1999 | 通用错误 |
| 2000-2999 | 用户相关错误 |
| 4000-4999 | 项目相关错误 |
| 9000-9999 | 系统错误 |

### 业务服务

- **ProjectService**: 项目 CRUD 和成员管理
- **ProjectMemberService**: 项目成员添加/移除/角色变更
- **OrgProjectService**: 项目与组织关联管理
- **EmployeeService**: 员工管理

## 数据模型

核心模型位于 `app/models/`:
- **User**: 用户账号 (与 Employee 通过 UserEmployeeMapping 关联)
- **Employee**: 员工信息 (支持主部门 + 副部门)
- **OrganizationUnit**: 组织架构 (支持层级闭包表)
- **Project/ProjectMember/OrgProject**: 项目及项目成员/组织关联
- **Skill**: 技能库

## 配置

- 数据库: MySQL (`127.0.0.1:3306/cdp`)
- 运行端口: `8001`
- JWT 认证: `app/core/security.py`
- 日志配置: `app/core/logging.py`
- 日志文件: `logs/cdp-backend.log`
