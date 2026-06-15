.PHONY: install build dev test test:watch test:coverage typecheck lint format clean

install:
	@npm install

build: build:main build:worker
	@echo "Build complete"

build:main:
	@npx tsc

build:worker:
	@npx tsc --project tsconfig.worker.json

dev:
	@npx tsx watch src/index.ts

test:
	@npx vitest run

test:watch:
	@npx vitest

test:coverage:
	@npx vitest run --coverage

typecheck:
	@npx tsc --noEmit

lint:
	@npx eslint src tests --ext .ts

format:
	@npx prettier --write "src/**/*.ts" "tests/**/*.ts"

clean:
	@rm -rf dist coverage

i: install
b: build
t: test
tc: test:coverage
ti: typecheck
fmt: format
c: clean