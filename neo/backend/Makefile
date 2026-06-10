.PHONY: help install dev test lint format type-check clean migrate migrate-gen

# Use uv to manage the project
UV := uv

# Current directory (where Makefile is located)
CURRENT_DIR := $(shell pwd)

# Default target
help:
	@echo "Available targets:"
	@echo "  install       - Sync dependencies with uv"
	@echo "  dev           - Run development server (port 8000)"
	@echo "  test          - Run tests"
	@echo "  lint          - Run linting"
	@echo "  format        - Format code"
	@echo "  type-check    - Run type checking"
	@echo "  clean         - Clean temporary files"
	@echo "  migrate       - Run database migrations"
	@echo "  migrate-gen   - Generate new migration (MSG='description')"

# Install/sync dependencies
install:
	$(UV) sync

# Run development server
dev: install
	$(UV) run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
test:
	PYTHONPATH=src $(UV) run pytest tests/ -v --cov=app

# Run storage tests only
test-storage:
	PYTHONPATH=src $(UV) run pytest tests/storage/ -v

# Run storage integration tests
test-storage-integration:
	PYTHONPATH=src RUN_INTEGRATION_TESTS=1 $(UV) run pytest tests/storage/test_rustfs_integration.py -v

# Run linting
lint:
	$(UV) run ruff check src/ tests/

# Format code
format:
	$(UV) run ruff format src/ tests/

# Type checking
typecheck:
	$(UV) run mypy src/ --ignore-missing-imports

# Clean temporary files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true

# Run migrations
migrate:
	$(UV) run alembic upgrade head

# Generate migration
migrate-gen:
	$(UV) run alembic revision --autogenerate -m "$(MSG)"
