# 电商网站后端项目提示词

## 项目概述

本项目为电商网站的后端应用，基于 Python + FastAPI 构建，采用分层架构设计。

## 技术栈

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | FastAPI | 高性能异步 API 框架 |
| ORM | SQLAlchemy 2.0 | 数据库 ORM |
| 数据库 | MySQL | 主数据库 |
| 验证 | Pydantic v2 | 数据验证 |
| 认证 | JWT (python-jose) | Token 认证 |
| 密码 | Passlib + bcrypt | 密码加密 |
| 迁移 | Alembic | 数据库迁移 |
| 异步 | asyncio + aiomysql | 异步数据库 |
| 缓存 | Redis | 缓存层 |
| 文档 | OpenAPI/Swagger | 自动文档 |

## 项目结构

```
backend/
├── src/
│   └── app/
│       ├── __init__.py
│       ├── main.py              # FastAPI 入口
│       ├── config.py            # 配置管理
│       ├── database.py          # 数据库连接
│       ├── dependencies.py      # 依赖注入
│       ├── models/              # SQLAlchemy 模型
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── product.py
│       │   ├── category.py
│       │   ├── cart.py
│       │   ├── order.py
│       │   └── address.py
│       ├── schemas/             # Pydantic 模型
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── product.py
│       │   ├── category.py
│       │   ├── cart.py
│       │   ├── order.py
│       │   └── common.py
│       ├── api/                 # API 路由
│       │   ├── __init__.py
│       │   ├── v1/
│       │   │   ├── __init__.py
│       │   │   ├── auth.py
│       │   │   ├── users.py
│       │   │   ├── products.py
│       │   │   ├── categories.py
│       │   │   ├── cart.py
│       │   │   ├── orders.py
│       │   │   └── addresses.py
│       │   └── deps.py          # API 公共依赖
│       ├── services/            # 业务逻辑层
│       │   ├── __init__.py
│       │   ├── user_service.py
│       │   ├── product_service.py
│       │   ├── cart_service.py
│       │   └── order_service.py
│       ├── repositories/        # 数据访问层
│       │   ├── __init__.py
│       │   ├── user_repo.py
│       │   ├── product_repo.py
│       │   ├── cart_repo.py
│       │   └── order_repo.py
│       ├── core/                # 核心模块
│       │   ├── __init__.py
│       │   ├── security.py      # 安全工具
│       │   └── exceptions.py    # 自定义异常
│       └── utils/               # 工具函数
│           ├── __init__.py
│           └── pagination.py
├── tests/                      # 测试目录
│   ├── __init__.py
│   ├── conftest.py
│   ├── api/
│   ├── services/
│   └── repositories/
├── alembic/                    # 数据库迁移
│   ├── env.py
│   └── versions/
├── scripts/                    # 脚本目录
├── requirements.txt
├── alembic.ini
└── README.md
```

## 分层架构

### 架构图

```
                    ┌─────────────────┐
                    │   API Layer     │
                    │   (api/v1/*)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Service Layer  │
                    │ (services/*)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
     │ Repository    │ │  Cache    │ │  External │
     │ Layer         │ │  (Redis)  │ │  Services │
     └───────┬───────┘ └───────────┘ └───────────┘
             │
     ┌───────▼───────┐
     │   Database    │
     │   (MySQL)     │
     └───────────────┘
```

### 1. API 层 (`api/`)

**职责**: 处理 HTTP 请求/响应，参数验证，路由分发

```
API 层设计原则：
├── 按版本管理: api/v1/
├── 按模块拆分: users.py, products.py, orders.py...
├── 单一职责: 一个路由文件只管一个资源
└── 薄控制器: 只做参数验证和响应封装
```

**路由文件结构**:
```python
# api/v1/products.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_user
from schemas.product import ProductSchema, ProductCreateSchema
from services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["商品"])


@router.get("/", response_model=list[ProductSchema])
def list_products(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = ProductService(db)
    return service.get_products(skip=skip, limit=limit)
```

### 2. Schema 层 (`schemas/`)

**职责**: Pydantic 数据模型，请求/响应验证

```
Schema 设计原则：
├── 请求 Schema: *Create, *Update, *Query
├── 响应 Schema: *Schema, *ListResponse
├── 嵌套验证: 使用 Pydantic 嵌套模型
└── 继承 BaseSchema: id, created_at, updated_at
```

**Schema 示例**:
```python
# schemas/product.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    category_id: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)


class ProductSchema(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: list[ProductSchema]
    total: int
    skip: int
    limit: int
```

### 3. Service 层 (`services/`)

**职责**: 业务逻辑编排，事务管理

```
Service 层设计原则：
├── 无状态: 每个方法接收 db session
├── 单一业务: 一个 service 管一个资源
├── 事务边界: 在 service 层管理事务
├── 不直接处理 HTTP
└── 异常抛出: 业务异常抛到 API 层
```

**Service 示例**:
```python
# services/product_service.py
from sqlalchemy.orm import Session
from typing import Optional

from models.product import Product
from schemas.product import ProductCreate, ProductUpdate
from repositories.product_repo import ProductRepository


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)

    def get_products(self, skip: int = 0, limit: int = 20) -> tuple[list[Product], int]:
        return self.repo.get_multi(skip=skip, limit=limit)

    def get_product(self, product_id: int) -> Optional[Product]:
        return self.repo.get_by_id(product_id)

    def create_product(self, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        return self.repo.create(product)

    def update_product(self, product_id: int, data: ProductUpdate) -> Optional[Product]:
        product = self.repo.get_by_id(product_id)
        if not product:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return self.repo.update(product, update_data)

    def delete_product(self, product_id: int) -> bool:
        product = self.repo.get_by_id(product_id)
        if not product:
            return False
        self.repo.delete(product)
        return True
```

### 4. Repository 层 (`repositories/`)

**职责**: 数据访问封装，查询构建

```
Repository 设计原则：
├── 数据访问的唯一入口
├── 不包含业务逻辑
├── 返回模型对象或 None
├── 提供通用 CRUD 方法
└── 复杂查询在 Repository 中实现
```

**Repository 示例**:
```python
# repositories/product_repo.py
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional

from models.product import Product


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = Product

    def get_by_id(self, id: int) -> Optional[Product]:
        return self.db.get(self.model, id)

    def get_multi(self, skip: int = 0, limit: int = 20) -> tuple[list[Product], int]:
        query = select(self.model).offset(skip).limit(limit)
        items = self.db.execute(query).scalars().all()
        total = self.db.query(self.model).count()
        return items, total

    def create(self, obj: Product) -> Product:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, obj: Product, data: dict) -> Product:
        for key, value in data.items():
            setattr(obj, key, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: Product) -> None:
        self.db.delete(obj)
        self.db.commit()
```

### 5. Model 层 (`models/`)

**职责**: SQLAlchemy 数据库模型定义

```
Model 设计原则：
├── 使用 Declarative Base
├── 每个模型单独文件
├── 关系定义在子模型中
├── 不包含业务逻辑
└── 使用 Column 类型注解
```

**Model 示例**:
```python
# models/product.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))

    category: Mapped["Category"] = relationship("Category", back_populates="products")
    cart_items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="product")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## 开发规范

### 项目初始化

```bash
# 1. 创建项目结构
mkdir -p backend/src/app/{api/v1,models,schemas,services,repositories,core,utils}
mkdir -p backend/tests/{api,services,repositories}
mkdir -p backend/alembic/versions
mkdir -p backend/scripts

# 2. 安装依赖
pip install fastapi uvicorn sqlalchemy pymysql pydantic pydantic-settings python-jose passlib bcrypt alembic redis python-multipart

# 3. 配置环境变量
cp .env.example .env
```

### 配置文件示例

```python
# src/app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://user:password@localhost:3306/ecommerce"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
```

### 数据库设计

**核心表结构**:

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| addresses | 收货地址表 |
| categories | 商品分类表 |
| products | 商品表 |
| cart_items | 购物车表 |
| orders | 订单表 |
| order_items | 订单明细表 |

### API 版本管理

```
/api/v1/auth/login
/api/v1/users/me
/api/v1/products
/api/v1/categories
/api/v1/cart/items
/api/v1/orders
```

### 认证流程

```python
# 1. 登录获取 Token
POST /api/v1/auth/login
Request: { "username": "xxx", "password": "xxx" }
Response: { "access_token": "xxx", "token_type": "bearer" }

# 2. 使用 Token 访问受保护资源
Headers: Authorization: Bearer <token>
```

### 错误处理

```python
# core/exceptions.py
class AppException(Exception):
    def __init__(self, message: str, code: str = "APP_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, resource: str):
        super().__init__(f"{resource} not found", "NOT_FOUND")


class UnauthorizedException(AppException):
    def __init__(self):
        super().__init__("Unauthorized", "UNAUTHORIZED")
```

### 日志规范

```python
import logging

logger = logging.getLogger(__name__)

# 记录请求
logger.info(f"Creating order for user {user_id}")
# 记录错误
logger.error(f"Failed to process payment: {e}")
# 结构化日志
logger.info({"event": "order_created", "order_id": order_id, "user_id": user_id})
```

## 开发流程

### 1. 需求分析
- 分析 API 接口需求
- 设计数据模型
- 确定业务规则

### 2. 数据库设计
- 创建 Alembic 迁移
- 编写 Model 定义
- 生成迁移脚本

### 3. 目录脚手架
```bash
# 显式创建项目结构（符合 src/ 目录规范）
mkdir -p backend/src/app/{api/v1,models,schemas,services,repositories,core,utils}
mkdir -p backend/tests/{api,services,repositories}
mkdir -p backend/alembic/versions
mkdir -p backend/scripts
mkdir -p backend/logs

# 创建空 __init__.py
find backend/src/app -name "__init__.py" -prune -o -type d -exec touch {}/__init__.py \; 2>/dev/null || true
```

### 4. 代码开发流程

```
Step 1: 定义 Model (models/)
Step 2: 定义 Schema (schemas/)
Step 3: 实现 Repository (repositories/)
Step 4: 实现 Service (services/)
Step 5: 实现 API 路由 (api/v1/)
Step 6: 注册路由到 main.py
Step 7: 编写单元测试
Step 8: 编写集成测试
```

### 5. 数据库迁移

```bash
# 创建迁移
alembic revision --autogenerate -m "add products table"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

## 核心功能模块

### 1. 用户模块
- 用户注册/登录
- JWT Token 认证
- 密码加密存储
- 用户信息管理

### 2. 商品模块
- 商品 CRUD
- 分类管理
- 库存管理
- 商品搜索/筛选

### 3. 购物车模块
- 加入购物车
- 修改数量
- 删除商品
- 清空购物车

### 4. 订单模块
- 创建订单
- 订单状态流转
- 订单查询
- 取消订单

## 测试规范

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from main import app
from database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

## 环境配置

```env
# .env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/ecommerce
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 性能考虑

- 数据库索引优化
- 分页查询
- Redis 缓存热点数据
- 异步任务队列
- 连接池配置

## 健康检查

```python
# src/app/api/v1/health.py
from fastapi import APIRouter

router = APIRouter(tags=["健康检查"])


@router.get("/health")
def health_check():
    return {"status": "healthy"}


@router.get("/health/db")
def health_check_db(db: Session = Depends(get_db)):
    db.execute("SELECT 1")
    return {"status": "healthy", "database": "connected"}
```

## 数据库种子数据

```python
# scripts/seed.py
"""数据库种子数据脚本"""
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.core.security import get_password_hash


def seed_database(db: Session):
    """填充测试数据"""
    # 创建管理员用户
    admin = User(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        is_admin=True,
    )
    db.add(admin)

    # 创建分类
    categories = [
        Category(name="电子产品"),
        Category(name="服装"),
        Category(name="食品"),
    ]
    for cat in categories:
        db.add(cat)
    db.commit()

    # 创建商品
    products = [
        Product(name="iPhone 15", price=6999.0, stock=100, category_id=1),
        Product(name="MacBook Pro", price=12999.0, stock=50, category_id=1),
    ]
    for product in products:
        db.add(product)
    db.commit()


if __name__ == "__main__":
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        seed_database(db)
        print("Seed data created successfully")
    finally:
        db.close()
```
