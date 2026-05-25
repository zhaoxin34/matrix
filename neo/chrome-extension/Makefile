.PHONY: help install dev build lint format typecheck clean load

# Default target
help:
	@echo "Available targets:"
	@echo "  install      - Install dependencies (pnpm install)"
	@echo "  dev          - Build and watch for development"
	@echo "  build        - Build for production (includes copy-assets)"
	@echo "  lint         - Run ESLint"
	@echo "  format       - Format code with Prettier"
	@echo "  typecheck    - Run TypeScript check"
	@echo "  clean        - Clean build artifacts"
	@echo "  load         - Show instructions to load extension in Chrome"

# Install dependencies
install:
	pnpm install

# Build for development (watch mode)
dev: install
	pnpm dev

# Build for production
build: install
	pnpm build && pnpm copy-assets

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
	rm -rf dist
	rm -rf .vite
	find . -type d -name "node_modules" -prune -o -type f -name "*.tsbuildinfo" -delete 2>/dev/null || true

# Load extension in Chrome
load:
	@echo "To load the extension in Chrome:"
	@echo "1. Run 'make build' to build the extension"
	@echo "2. Open Chrome and go to: chrome://extensions/"
	@echo "3. Enable 'Developer mode'"
	@echo "4. Click 'Load unpacked'"
	@echo "5. Select the 'dist' directory"
	@echo ""
	@echo "The extension is built at: ./dist"
