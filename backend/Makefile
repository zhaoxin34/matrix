.PHONY: help install dev test lint format type-check clean migrate migrate-gen seed

# Default target
help:
	@echo "Available targets:"
	@echo "  install       - Install dependencies"
	@echo "  dev           - Run development server"
	@echo "  test           - Run tests"
	@echo "  lint           - Run linting"
	@echo "  format         - Format code"
	@echo "  type-check     - Run type checking"
	@echo "  clean          - Clean temporary files"
	@echo "  migrate        - Run database migrations"
	@echo "  migrate-gen    - Generate new migration"
	@echo "  seed           - Seed database with sample data"

# Install dependencies
install:
	pip install -r requirements.txt

# Run development server
dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
test:
	pytest tests/ -v --cov=app --cov-report=term-missing

# Run linting
lint:
	ruff check src/ tests/

# Format code
format:
	ruff format src/ tests/

# Type checking
type-check:
	mypy src/ --ignore-missing-imports

# Clean temporary files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true

# Run migrations
migrate:
	alembic upgrade head

# Generate migration
migrate-gen:
	alembic revision --autogenerate -m "$(MSG)"

# Seed database
seed:
	python scripts/seed.py
