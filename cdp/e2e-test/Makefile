.PHONY: install test test-slow test-smoke report open-report clean dev

BASE_URL ?= http://localhost:3001
PLAYWRIGHT_BROWSERS_PATH ?= /tmp/claude/playwright-browsers

install:
	uv sync
	uv run playwright install chromium --with-deps

test:
	PLAYWRIGHT_BASE_URL=$(BASE_URL) uv run pytest -m "not slow"

test-slow:
	PLAYWRIGHT_BASE_URL=$(BASE_URL) uv run pytest -m slow

test-smoke:
	PLAYWRIGHT_BASE_URL=$(BASE_URL) uv run pytest -m smoke

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
	PLAYWRIGHT_BASE_URL=$(BASE_URL) uv run pytest -v --headed

lint:
	uv run ruff check src/

typecheck:
	uv run mypy src/

format:
	uv run ruff format src/ 

fmt-lint:
	uv run ruff format src/ tests/ && uv run ruff check src/ tests/ --fix
