# 电商网站全栈项目提示词

## 项目概述

本项目为电商网站全栈 Demo，采用前后端分离架构，基于你擅长的技术栈（Python FastAPI + React TypeScript）构建。

## 项目架构

```
ecommerce/
├── frontend/                  # 前端应用
│   └── (见 frontend prompt)
├── backend/                   # 后端应用
│   └── (见 backend prompt)
├── docker/                    # Docker 配置
│   ├── docker-compose.yml
│   ├── frontend.Dockerfile
│   └── backend.Dockerfile
├── Makefile                   # 统一构建命令
├── .env.example              # 环境变量模板
└── README.md                 # 项目说明
```

## 技术栈概览

### 后端技术栈

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | FastAPI | 高性能异步 API |
| ORM | SQLAlchemy 2.0 | 数据库 ORM |
| 数据库 | MySQL | 主数据库 |
| 缓存 | Redis | 缓存层 |
| 认证 | JWT | Token 认证 |
| 文档 | OpenAPI/Swagger | 自动文档 |

### 前端技术栈

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | React 19 | 最新 React |
| 构建 | Vite | 快速构建 |
| 语言 | TypeScript 5 | 类型安全 |
| UI 库 | Ant Design 5 | 企业级 UI |
| 路由 | React Router 6 | SPA 路由 |
| 状态 | Zustand | 轻量状态管理 |
| HTTP | Axios | API 调用 |

## 项目初始化流程

### 1. 创建项目结构

```bash
# 创建项目根目录
mkdir -p ecommerce
cd ecommerce

# 创建子项目目录
mkdir -p frontend backend docker scripts
```

### 2. 初始化后端项目

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install fastapi uvicorn sqlalchemy pymysql pydantic python-jose passlib bcrypt alembic redis python-multipart

# 生成 requirements.txt
pip freeze > requirements.txt
```

### 3. 初始化前端项目

```bash
cd ../frontend

# 创建 Vite 项目
npm create vite@latest . -- --template react-ts

# 安装依赖
npm install
npm install antd @ant-design/icons axios react-router-dom zustand react-hook-form zod @hookform/resolvers recharts

# 安装开发依赖
npm install -D eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 4. 配置 Git

```bash
# 在项目根目录初始化 Git
cd ..
git init

# 创建 .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
venv/
.env
*.egg-info/
dist/
build/

# Node
node_modules/
dist/
.env.local
.DS_Store

# IDE
.vscode/
.idea/
*.swp

# Database
*.db
*.sqlite

# Logs
*.log
EOF

# 设置 Git hooks
git config core.hooksPath hooks

# 创建 hooks 目录和 pre-commit 钩子
mkdir -p hooks
cat > hooks/pre-commit << 'EOF'
#!/bin/sh
# Pre-commit hook: 代码检查
set -e

echo "Running pre-commit checks..."

# 后端检查
cd backend
if [ -f "requirements.txt" ]; then
    echo "Checking Python code..."
    python -m black --check . 2>/dev/null || true
    python -m flake8 . 2>/dev/null || true
fi
cd ..

# 前端检查
cd frontend
if [ -f "package.json" ]; then
    echo "Checking TypeScript code..."
    npm run lint 2>/dev/null || true
    npm run type-check 2>/dev/null || true
fi
cd ..

echo "Pre-commit checks passed!"
EOF
chmod +x hooks/pre-commit

# 创建 commit-msg 钩子（规范提交格式）
cat > hooks/commit-msg << 'EOF'
#!/bin/sh
# Commit-msg hook: 检查提交信息格式
commit_msg=$(cat "$1")
pattern="^(feat|fix|docs|style|refactor|test|chore)(\([a-zA-Z0-9_-]+\))?: .{1,50}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
    echo "Invalid commit message format!"
    echo "Expected: <type>(<scope>): <subject>"
    echo "Types: feat, fix, docs, style, refactor, test, chore"
    exit 1
fi
EOF
chmod +x hooks/commit-msg
```

## 开发规范

### 1. 命名规范

```
后端 (Python):
├── 模块名: snake_case (user_service.py)
├── 类名: PascalCase (UserService)
├── 函数名: snake_case (get_user_by_id)
├── 常量: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
└── 路由前缀: /api/v1/resource

前端 (TypeScript):
├── 组件名: PascalCase (UserProfile.tsx)
├── 文件名: PascalCase (UserProfile.tsx)
├── 变量/函数: camelCase (userName, getUserById)
├── 常量: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
├── CSS 类名: kebab-case (user-profile)
└── API 路由: /api/v1/resource
```

### 2. 代码格式化

**后端 (Python)**:
```bash
# 安装 black, isort
pip install black isort

# 格式化命令
black .
isort .
```

**前端 (TypeScript)**:
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 3. 代码检查

**后端 (Python)**:
```bash
# 安装 flake8, mypy
pip install flake8 mypy

# 检查命令
flake8 .
mypy .
```

**前端 (TypeScript)**:
```bash
# ESLint 检查
npm run lint

# TypeScript 类型检查
npm run type-check
```

### 4. 测试规范

```
测试文件位置:
├── backend/tests/
│   ├── conftest.py
│   ├── api/
│   │   └── test_users.py
│   ├── services/
│   │   └── test_user_service.py
│   └── repositories/
│       └── test_user_repo.py
└── frontend/src/__tests__/
    ├── components/
    └── hooks/
```

### 5. Git 提交规范

```
格式: <type>(<scope>): <subject>

type:
├── feat: 新功能
├── fix: 修复 bug
├── docs: 文档变更
├── style: 格式调整
├── refactor: 重构
├── test: 测试
└── chore: 构建/工具

示例:
feat(product): 添加商品搜索功能
fix(cart): 修复购物车数量更新问题
docs(api): 更新 API 文档
```

## 开发流程

### 1. 需求分析阶段

```
产出物:
├── 技术方案设计文档
├── API 接口设计文档
├── 数据库设计文档
└── 页面原型/UI 设计
```

### 2. 架构设计阶段

```
后端:
├── 设计数据模型 (Model)
├── 设计 API Schema
├── 设计 Service 层接口
└── 设计 Repository 层接口

前端:
├── 设计组件结构
├── 设计页面路由
├── 设计状态管理结构
└── 设计 API 调用接口
```

### 3. 迭代开发阶段

```
每个功能开发流程:

后端:
Step 1: 编写数据库迁移
Step 2: 实现 Model
Step 3: 实现 Schema
Step 4: 实现 Repository
Step 5: 实现 Service
Step 6: 实现 API 路由
Step 7: 编写单元测试

前端:
Step 1: 实现 API 客户端
Step 2: 实现 TypeScript 类型
Step 3: 实现自定义 Hooks
Step 4: 实现组件
Step 5: 实现页面
Step 6: 编写测试

前后端联调:
Step 8: API 联调测试
Step 9: 功能集成测试
```

### 代码完成后检查流程

每次完成代码编写后，必须执行以下步骤（按顺序）：

```bash
# 1. 代码简化: 运行 /simplify 检查并优化代码
/simplify

# 2. 代码格式化: 运行项目中的 format 命令
make format

# 3. 类型检查: 运行项目中的 type-check 命令
make type-check  # 或 mypy backend && npm run type-check

# 4. 代码检查: 运行项目中的 lint 命令
make lint

# 5. 运行测试: 运行项目中的 test 命令
make test

# 6. Git 提交: 确保所有检查通过后再提交
git add .
git commit -m "..."
```

### 4. 代码审查阶段

```
审查清单:
□ 代码符合命名规范
□ 代码符合分层架构
□ 有适当的注释
□ 无硬编码配置
□ 有错误处理
□ 有日志记录
□ 单元测试覆盖
□ 通过代码检查工具
```

### 5. 部署发布阶段

```bash
# 构建后端
cd backend
pip install -r requirements.txt
alembic upgrade head

# 构建前端
cd ../frontend
npm install
npm run build

# Docker 部署
docker-compose up -d
```

## Makefile 规范

```makefile
# 通用配置
.PHONY: help install dev test lint format clean

# 帮助信息
help:
	@grep -E '^[a-zA-Z_-]+:' Makefile | sed 's/:.*//' | sort | while read cmd; do \
		echo "$$cmd: "; grep -A 1 "^$$cmd:" Makefile | tail -1 | sed 's/^[[:space:]]*# /  /'; \
	done

# 安装依赖
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# 后端开发
dev:
	cd backend && uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000

# 前端开发
dev-fe:
	cd frontend && npm run dev

# 后端测试
test:
	cd backend && pytest -v

# 前端测试
test-fe:
	cd frontend && npm run test

# 代码检查
lint:
	cd backend && flake8 . && mypy .
	cd frontend && npm run lint

# 代码格式化
format:
	cd backend && black . && isort .
	cd frontend && npm run format

# 清理
clean:
	cd backend && find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	cd backend && find . -name "*.pyc" -delete
	cd frontend && rm -rf dist node_modules/.cache

# Docker 构建
docker-build:
	docker-compose build

# Docker 启动
docker-up:
	docker-compose up -d

# Docker 停止
docker-down:
	docker-compose down

# 数据库迁移
migrate:
	cd backend && alembic upgrade head

# 数据库回滚
migrate-down:
	cd backend && alembic downgrade -1

# 生成迁移
migrate-gen:
	cd backend && alembic revision --autogenerate -m "$(MSG)"
```

## Docker 配置

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend.Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql+pymysql://user:password@db:3306/ecommerce
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
    command: uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend.Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api/v1
    command: npm run dev

  db:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=ecommerce
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

## 环境变量规范

### .env.example

```env
# 后端配置
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/ecommerce
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 前端配置
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## API 设计规范

### RESTful 规范

```
资源命名: 复数名词
HTTP 方法:
├── GET    /products      列表
├── GET    /products/:id  详情
├── POST   /products      创建
├── PUT    /products/:id  更新
├── DELETE /products/:id  删除

分页参数:
├── skip: 跳过的数量
└── limit: 返回数量

排序参数:
└── sort: field:asc|desc

筛选参数:
└── filter[field]: value
```

### 统一响应格式

```json
// 成功响应
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 错误响应
{
  "code": 404,
  "message": "Product not found",
  "error": "NOT_FOUND"
}
```

## 项目文档结构

```
ecommerce/
├── docs/
│   ├── api/                  # API 文档
│   │   ├── openapi.json
│   │   └── endpoints/
│   ├── architecture/         # 架构文档
│   │   ├── overview.md
│   │   └── design.md
│   └── guides/               # 开发指南
│       ├── setup.md
│       ├── deployment.md
│       └── testing.md
├── frontend/
│   └── README.md
├── backend/
│   └── README.md
└── README.md                 # 项目根 README
```

## 质量保证

### 代码质量

```
□ TypeScript 严格模式
□ Python 类型注解
□ ESLint + Prettier
□ flake8 + black + isort
□ 单元测试覆盖率 > 80%
```

### 性能目标

```
□ API 响应时间 < 200ms
□ 前端首屏加载 < 3s
□ Lighthouse 性能分 > 90
```

### 安全要求

```
□ JWT Token 认证
□ 密码 bcrypt 加密
□ SQL 注入防护
□ XSS 防护
□ CORS 配置
□ Rate Limiting
```

## 开发工具推荐

### 后端开发

- PyCharm / VSCode + Python 插件
- Postman / Insomnia (API 测试)
- MySQL Workbench (数据库管理)

### 前端开发

- VSCode + ESLint + Prettier
- React Developer Tools
- Redux DevTools (如果用 Redux)
- Chrome DevTools

### 通用

- Docker Desktop
- Git
- iTerm2 / Windows Terminal
