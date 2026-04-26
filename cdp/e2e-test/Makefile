.PHONY: install test test-slow test-smoke report open-report clean dev

BASE_URL ?= http://localhost:3002
PLAYWRIGHT_BROWSERS_PATH ?= /tmp/claude/playwright-browsers

install:
	uv sync
	uv run playwright install chromium --with-deps

test:
	PLAYWRIGHT_BASE_URL=$(BASE_URL) .venv/bin/python -m pytest -m "not slow" -s

test-slow:
	PLAYWRIGHT_BASE_URL=$(BASE_URL) .venv/bin/python -m pytest -m slow -s

test-smoke:
	PLAYWRIGHT_BASE_URL=$(BASE_URL) .venv/bin/python -m pytest -m smoke -s

report:
	allure generate reports/allure-results -o reports/allure-report --clean

open-report:
	allure open reports/allure-report

clean:
	rm -rf reports/
	rm -rf .pytest_cache/
	rm -rf src/*.egg-info/
	rm -rf .ruff_cache/

dev:
	PLAYWRIGHT_BASE_URL=$(BASE_URL) .venv/bin/python -m pytest -v --headed -s

lint:
	uv run ruff check src/

typecheck:
	uv run mypy src/

format:
	uv run ruff format src/

fmt-lint:
	uv run ruff format src/ tests/ && uv run ruff check src/ tests/ --fix
