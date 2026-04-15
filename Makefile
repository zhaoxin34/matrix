.PHONY: help frontend-install frontend-dev frontend-build frontend-lint frontend-format frontend-type-check frontend-test frontend-clean

help:
	@echo "Available commands:"
	@echo "  make frontend-install      - Install frontend dependencies"
	@echo "  make frontend-dev          - Start frontend development server"
	@echo "  make frontend-build        - Build frontend for production"
	@echo "  make frontend-lint         - Run frontend ESLint"
	@echo "  make frontend-format       - Format frontend code with Prettier"
	@echo "  make frontend-type-check   - Run frontend TypeScript type checking"
	@echo "  make frontend-test         - Run frontend tests"
	@echo "  make frontend-clean        - Clean frontend build artifacts"

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

frontend-format:
	cd frontend && npm run format

frontend-type-check:
	cd frontend && npm run type-check

frontend-test:
	cd frontend && npm run test

frontend-clean:
	cd frontend && npm run clean
