# E-commerce Backend API

A FastAPI-based backend for e-commerce application with 分层架构 (layered architecture).

## Architecture

```
API Layer (Routes) -> Service Layer -> Repository Layer -> Database
```

## Features

- User authentication with JWT
- Product and category management
- Shopping cart functionality
- Order processing
- Address management

## Tech Stack

- **Framework**: FastAPI
- **Database**: MySQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Authentication**: JWT with python-jose
- **Validation**: Pydantic

## Setup

1. Install dependencies:
```bash
make install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run migrations:
```bash
make migrate
```

4. Seed database (optional):
```bash
make seed
```

5. Start development server:
```bash
make dev
```

## API Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/products` - List products
- `GET /api/v1/categories` - List categories
- `GET /api/v1/cart/items` - Get cart items
- `POST /api/v1/orders` - Create order
- `GET /api/v1/addresses` - List addresses

## Development Commands

```bash
make help       # Show available commands
make install    # Install dependencies
make dev        # Run development server
make test       # Run tests
make lint       # Run linting
make format     # Format code
make type-check # Run type checking
make migrate    # Run migrations
make seed       # Seed database
make clean      # Clean temporary files
```
