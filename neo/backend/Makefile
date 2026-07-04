.PHONY: help install dev test lint format type-check clean migrate migrate-gen

# Use uv to manage the project
UV := uv

# Current directory (where Makefile is located)
CURRENT_DIR := $(shell pwd)

# Default target
help:
	@echo "Available targets:"
	@echo "  install                  - Sync dependencies with uv"
	@echo "  dev                      - Run development server (port 8000)"
	@echo "  test                     - Run tests"
	@echo "  test-storage             - Run storage tests (unit + integration skip)"
	@echo "  test-storage-integration - Run storage integration tests (needs RustFS)"
	@echo "  lint                     - Run linting"
	@echo "  format                   - Format code"
	@echo "  type-check               - Run type checking"
	@echo "  clean                    - Clean temporary files"
	@echo "  migrate                  - Run database migrations"
	@echo "  migrate-gen              - Generate new migration (MSG='description')"

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

# Run storage integration tests (requires a running RustFS instance)
test-storage-integration:
	PYTHONPATH=src RUN_INTEGRATION_TESTS=1 $(UV) run pytest \
		tests/storage/test_rustfs_integration.py \
		tests/storage/test_rustfs_supplemental.py \
		tests/storage/test_recording_storage_e2e.py \
		-v

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

# Phase 3 production startup: alembic upgrade + uvicorn (no reload)
prod-up:
	PYTHONPATH=src $(UV) run alembic upgrade head
	PYTHONPATH=src $(UV) run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Disable AI interview at runtime (Phase 3 §15.6 feature flag)
ai-off:
	@echo "Set KNLG_AI_INTERVIEW_ENABLED=false in your env to disable AI 访谈."
	@grep -q "^KNLG_AI_INTERVIEW_ENABLED" .env 2>/dev/null \
	  && sed -i '' 's/^KNLG_AI_INTERVIEW_ENABLED=.*/KNLG_AI_INTERVIEW_ENABLED=false/' .env \
	  || echo 'KNLG_AI_INTERVIEW_ENABLED=false' >> .env

# Configure MiniMax (anthropic-compatible) provider for AI 访谈.
# Persists the non-secret ANTHROPIC_API_BASE line into .env. The actual API
# key is sourced from $MINIMAX_API_KEY at runtime — never write the secret
# value into a tracked file.
# Use: `export MINIMAX_API_KEY=xxx && make dev`
ai-minimax:
	@if [ -z "$$MINIMAX_API_KEY" ]; then echo "MINIMAX_API_KEY env var is not set; export it before running."; exit 1; fi
	@echo "MiniMax API key detected (length=$$(printf %s "$$MINIMAX_API_KEY" | wc -c))."
	@echo "Persisting ANTHROPIC_API_BASE to .env (api key NOT written)."
	@grep -q "^ANTHROPIC_API_BASE=" .env 2>/dev/null && sed -i '' 's|^ANTHROPIC_API_BASE=.*|ANTHROPIC_API_BASE="https://api.minimaxi.com/anthropic"|' .env || echo 'ANTHROPIC_API_BASE="https://api.minimaxi.com/anthropic"' >> .env
	@echo "Done. Now run: make dev   (it will read MINIMAX_API_KEY from your shell env)."
