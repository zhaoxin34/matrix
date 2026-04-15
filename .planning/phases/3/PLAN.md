---
objective: Create MySQL database, verify Alembic migrations, test development workflows, verify backend connects to MySQL
wave: 1
files_modified:
  - backend/
  - Makefile
tasks: 4
---

# Plan: Phase 3 - Integration & DevOps

## What This Builds

Final integration step: set up the MySQL database, verify Alembic migrations work, test development workflows, and verify the backend can connect to MySQL.

## Tasks

### 1. Create MySQL database

Connect to MySQL and create the ecommerce database:

```bash
mysql -u root -proot -h 127.0.0.1 -e "CREATE DATABASE IF NOT EXISTS ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Verify the database was created:
```bash
mysql -u root -proot -h 127.0.0.1 -e "SHOW DATABASES;"
```

### 2. Configure backend .env

Create `backend/.env` from `backend/.env.example`:
- Set DATABASE_URL to mysql+pymysql://root:root@127.0.0.1:3306/ecommerce
- Set REDIS_URL to redis://localhost:6379/0
- Set SECRET_KEY to a random string for JWT signing

### 3. Run Alembic migrations

Test that migrations work:
```bash
cd backend && alembic upgrade head
```

Verify tables were created:
```bash
mysql -u root -proot -h 127.0.0.1 ecommerce -e "SHOW TABLES;"
```

### 4. Start backend and verify

Start the backend server:
```bash
cd backend && uvicorn src.app.main:app --host 0.0.0.0 --port 8000 &
```

Wait for server to start, then verify:
- Health check: curl http://localhost:8000/health
- API docs: http://localhost:8000/docs

Kill the background server after verification.

### 5. Document development workflow

Create or update `README.md` in project root documenting:
- How to set up backend: cd backend && pip install -r requirements.txt && cp .env.example .env && alembic upgrade head
- How to set up frontend: cd frontend && npm install
- How to run development servers: make dev (backend) and make dev-fe (frontend)
- How to run tests: make test
- How to run lint: make lint

## Success Criteria

- Database created on MySQL
- Alembic migrations run successfully and tables created
- Backend starts and connects to MySQL
- Health check endpoint returns healthy
- Development workflow documented
