# DomSnapshot - 前端组件工程
# 提供 install / dev / build / test / format / typecheck 一条龙

.PHONY: help install dev build preview test test-watch format format-check typecheck clean

help:
	@echo "DomSnapshot Makefile"
	@echo "  make install     安装依赖"
	@echo "  make dev         启动 dev server (默认 http://127.0.0.1:5100)"
	@echo "  make build       构建库产物 (ESM + CJS + d.ts)"
	@echo "  make preview     预览生产构建"
	@echo "  make test        跑单测"
	@echo "  make test-watch  监听模式跑单测"
	@echo "  make format      格式化代码"
	@echo "  make format-check 检查格式"
	@echo "  make typecheck   类型检查"
	@echo "  make clean       清理 build 产物"

install:
	@if command -v pnpm >/dev/null 2>&1; then \
		echo ">> pnpm install"; \
		pnpm install; \
	else \
		if command -v npm >/dev/null 2>&1; then \
			echo ">> npm install"; \
			npm install; \
		else \
			echo "!! 请先安装 pnpm 或 npm"; \
			exit 1; \
		fi; \
	fi

dev:
	npx vite

build:
	npx vite build --config vite.config.lib.ts && npx tsc -p tsconfig.json --emitDeclarationOnly --outDir dist

preview:
	npx vite preview

test:
	npx vitest run

test-watch:
	npx vitest

format:
	npx prettier --write "src/**/*.{ts,tsx,css,html}" "tests/**/*.ts"

format-check:
	npx prettier --check "src/**/*.{ts,tsx,css,html}" "tests/**/*.ts"

typecheck:
	npx tsc --noEmit -p tsconfig.test.json

clean:
	rm -rf dist dist-demo coverage *.tsbuildinfo
