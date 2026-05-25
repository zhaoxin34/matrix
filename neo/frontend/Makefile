.PHONY: help install dev build lint format typecheck clean

# Default target
help:
	@echo "Available targets:"
	@echo "  install       - Install dependencies (pnpm install)"
	@echo "  dev           - Start development server (port 3300)"
	@echo "  build         - Build for production"
	@echo "  lint          - Run ESLint"
	@echo "  format        - Format code with Prettier"
	@echo "  typecheck     - Run TypeScript check"
	@echo "  clean         - Clean build artifacts"

# Install dependencies
install:
	pnpm install

# Start development server
dev:
	pnpm dev

# Build for production
build:
	pnpm build

# Run ESLint
lint:
	pnpm lint

# Format code
format:
	pnpm format

# Type checking
typecheck:
	pnpm typecheck

# Clean build artifacts
clean:
	rm -rf .next
	rm -rf out
	find . -type d -name "node_modules" -prune -o -type f -name "*.tsbuildinfo" -delete 2>/dev/null || true
