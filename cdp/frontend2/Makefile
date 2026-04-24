.PHONY: help install dev build lint format type-check test clean

help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies (pnpm)"
	@echo "  make dev          - Start development server (http://localhost:3002)"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make lint         - Run ESLint"
	@echo "  make format       - Format code with Prettier"
	@echo "  make type-check   - Run TypeScript type checking"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean build artifacts"

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

lint:
	pnpm lint

format:
	pnpm exec prettier --write "src/**/*.{ts,tsx}"

type-check:
	pnpm exec tsc --noEmit

test:
	pnpm test

clean:
	rm -rf .next
