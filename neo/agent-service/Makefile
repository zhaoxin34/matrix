.PHONY: install dev test lint format typecheck build clean

install:
	uv sync

dev:
	uv run uvicorn agent_service.main:app --reload --host 0.0.0.0 --port 8001

test:
	uv run pytest tests/ -v

test-watch:
	uv run pytest tests/ -v --watch

lint:
	uv run ruff check src/ tests/

format:
	uv run ruff format src/ tests/

typecheck:
	uv run mypy src/

build:
	uv build

clean:
	rm -rf .venv .pytest_cache __pycache__ src/**/__pycache__ tests/__pycache__ *.egg-info
