# Neo 后端工程师 AGENTS.md

## 项目概览

Neo 后端是基于 Python FastAPI 构建的 REST API 服务，采用分层架构设计，支持 JWT 认证、MySQL 数据库和 Alembic 迁移管理。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 编程语言 |
| FastAPI | 0.109+ | Web 框架 |
| SQLAlchemy | 2.0+ | ORM |
| MySQL | 8.0+ | 关系数据库 |
| Alembic | 1.13+ | 数据库迁移 |
| Pydantic | 2.5+ | 数据验证 |
| python-jose | 3.3+ | JWT 认证 |
| bcrypt | 4.1+ | 密码加密 |

## 项目结构

```
backend/
├── src/app/                    # 应用源代码
│   ├── api/v1/                 # API 路由层
│   │   ├── auth.py            # 认证相关接口
│   │   ├── admin_users.py     # 用户管理接口
│   │   └── health.py          # 健康检查
│   ├── core/                   # 核心模块
│   │   ├── security.py        # JWT 工具函数
│   │   ├── exceptions.py       # 全局异常处理
│   │   ├── error_codes.py     # 错误码定义
│   │   └── logging.py         # 日志配置
│   ├── middleware/             # 中间件
│   │   └── logging_middleware.py
│   ├── models/                 # 数据模型
│   │   └── user.py
│   ├── repositories/           # 数据访问层
│   │   └── user_repository.py
│   ├── schemas/                # Pydantic 模型
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── response.py
│   ├── services/               # 业务逻辑层
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   └── sms_service.py
│   ├── config.py              # 配置管理
│   ├── database.py            # 数据库连接
│   ├── dependencies.py         # 依赖注入
│   └── main.py               # 应用入口
├── alembic/                   # 数据库迁移
│   └── versions/
├── tests/                    # 测试代码
├── hooks/                    # Git hooks
├── pyproject.toml           # 项目配置
├── alembic.ini             # Alembic 配置
└── Makefile                # 构建脚本
```

## 架构分层

### 1. 路由层 (API)

负责处理 HTTP 请求和响应，位于 `src/app/api/v1/`。

### 2. 服务层 (Service)

封装业务逻辑，位于 `src/app/services/`。

### 3. 数据访问层 (Repository)

封装数据库操作，位于 `src/app/repositories/`。

### 4. 模型层 (Model)

SQLAlchemy 数据模型，位于 `src/app/models/`。


## 认证机制

### JWT Token

```python
# src/app/core/security.py
```

### 认证流程

1. 用户登录后服务端生成 JWT token
2. token 通过 HTTP Only Cookie 和响应 body 同时返回
3. 后续请求通过 Cookie 自动携带 token
4. `/api/v1/auth/me` 接口验证 token 并返回用户信息

## 配置管理

### .env 配置文件

## 数据库迁移

### 使用 Alembic

## 开发命令

```bash
# 安装依赖
make install

# 启动开发服务器（端口 8000）
make dev

# 运行测试
make test

# 代码检查
make lint

# 代码格式化
make format

# 类型检查
make type-check

# 清理缓存
make clean
```

## 测试用户

```
username: 13800138002
password: abcd1234
```


### 提交规范

1. 运行 `make lint` 通过代码检查
2. 运行 `make format` 格式化代码
3. 运行 `make type-check` 通过类型检查
4. 运行 `make test` 通过所有测试
5. 使用 Git hooks 验证提交

### 依赖管理

使用 `uv` 管理 Python 依赖：
