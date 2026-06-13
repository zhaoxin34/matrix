.PHONY: help build dev test test-ui test-install clean zip lint format typecheck

# 帮助信息
help:
	@echo "Agent Steer - Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make build         # 构建扩展"
	@echo "  make dev           # 开发模式"
	@echo "  make test          # 运行 E2E 测试"
	@echo "  make test-ui       # 运行 E2E 测试 (UI 模式)"
	@echo "  make test-install  # 安装 Playwright 浏览器"
	@echo "  make clean         # 清理构建输出"
	@echo "  make zip           # 打包为 zip"
	@echo "  make lint          # 代码检查"
	@echo "  make format        # 代码格式化"
	@echo "  make typecheck     # 类型检查"

# 构建
build:
	pnpm run build

# 开发模式
dev:
	pnpm run dev

# 运行 E2E 测试
test: build
	pnpm run e2e

# 运行 E2E 测试 (UI 模式)
test-ui: build
	pnpm run e2e:ui

# 安装 Playwright 浏览器
test-install:
	pnpm run e2e:install

# 清理构建输出
clean:
	rm -rf .output
	rm -rf test-results
	rm -rf playwright-report

# 打包为 zip
zip:
	pnpm run zip

# 代码检查
lint:
	@echo "暂未配置 lint"

# 代码格式化
format:
	@echo "暂未配置 format"

# 类型检查
typecheck:
	pnpm run compile
