---
objective: FastAPI backend project scaffold with分层架构, database models, migrations, git hooks, Makefile, ready to connect to MySQL
wave: 1
files_modified:
  - backend/
  - Makefile
  - .gitignore
  - hooks/
tasks: 9
---

# Plan: Backend Architecture

## What This Builds

A complete FastAPI backend project scaffold following the project prompts specification. Creates the directory structure, all model files, API routes, services, repositories, and development infrastructure.

## Tasks

### 1. Create project structure and requirements.txt

Create the complete backend directory structure per prompts specification:

```
backend/
├── src/app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── dependencies.py
│   ├── models/
│   ├── schemas/
│   ├── api/v1/
│   ├── services/
│   ├── repositories/
│   ├── core/
│   └── utils/
├── tests/
├── alembic/
├── scripts/
├── requirements.txt
├── alembic.ini
└── README.md
```

Create requirements.txt with all dependencies from the prompts:
- fastapi, uvicorn, sqlalchemy, pymysql, pydantic, python-jose, passlib, bcrypt, alembic, redis, python-multipart, pydantic-settings

### 2. Create database models

Create SQLAlchemy models in `src/app/models/`:
- user.py: User model (id, username, email, hashed_password, is_admin, created_at, updated_at)
- product.py: Product model (id, name, description, price, stock, category_id, created_at, updated_at)
- category.py: Category model (id, name, description, created_at, updated_at)
- cart.py: CartItem model (id, user_id, product_id, quantity, created_at)
- order.py: Order model (id, user_id, status, total_amount, created_at, updated_at)
- order_item.py: OrderItem model (id, order_id, product_id, quantity, unit_price)
- address.py: Address model (id, user_id, name, phone, address, is_default, created_at)

### 3. Create Pydantic schemas

Create request/response schemas in `src/app/schemas/`:
- user.py, product.py, category.py, cart.py, order.py, address.py, common.py
- Include: *Base, *Create, *Update, *Schema, *ListResponse classes

### 4. Create Repository layer

Create data access layer in `src/app/repositories/`:
- user_repo.py, product_repo.py, cart_repo.py, order_repo.py
- Implement CRUD methods: get_by_id, get_multi, create, update, delete

### 5. Create Service layer

Create business logic layer in `src/app/services/`:
- user_service.py, product_service.py, cart_service.py, order_service.py
- Implement business operations using repository layer

### 6. Create API routes

Create API endpoints in `src/app/api/v1/`:
- auth.py: /auth/login, /auth/register
- users.py: /users/me, /users/{id}
- products.py: CRUD endpoints
- categories.py: CRUD endpoints
- cart.py: /cart/items CRUD
- orders.py: CRUD endpoints
- addresses.py: CRUD endpoints

Register all routes in main.py

### 7. Create core infrastructure

Create `src/app/core/`:
- security.py: JWT utilities, password hashing
- exceptions.py: Custom exception classes

Create `src/app/config.py`:
- Settings class using pydantic-settings
- Database URL, Redis URL, JWT secret, etc.

Create `src/app/database.py`:
- Database connection setup
- Session management

### 8. Create Alembic migration setup

Create `alembic.ini` and `alembic/env.py`
Initialize migration structure
Create initial migration for all models

### 9. Create development infrastructure

Create Makefile with targets:
- help, install, dev, test, lint, format, type-check, clean
- migrate, migrate-gen, seed

Create git hooks in `hooks/`:
- pre-commit: lint check
- commit-msg: conventional commits format check

Create .env.example with DATABASE_URL, REDIS_URL, SECRET_KEY, etc.

Create .gitignore for Python artifacts

## Success Criteria

- Backend project structure matches prompts specification
- All database models defined for all entities
- Alembic migrations generated and executable
-分层架构 (API → Service → Repository) implemented
- Git hooks configured (pre-commit, commit-msg)
- Makefile with lint, format, type-check, test commands
- Backend can start and connect to MySQL
