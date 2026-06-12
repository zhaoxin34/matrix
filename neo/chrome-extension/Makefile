.PHONY: install dev dev-firefox build build-firefox zip zip-firefox lint format typecheck test test-ui e2e e2e-ui clean rebuild submit

# 安装依赖
install:
	pnpm install --ignore-scripts
	pnpm exec wxt prepare

# 开发模式
dev:
	pnpm dev

# Firefox 开发模式
dev-firefox:
	pnpm dev:firefox

# 生产构建
build:
	pnpm build

# Firefox 生产构建
build-firefox:
	pnpm build:firefox

# 打包 ZIP
zip:
	pnpm zip

# Firefox 打包
zip-firefox:
	pnpm zip:firefox

# 代码检查
lint:
	pnpm lint

# 代码格式化
format:
	pnpm format

# 类型检查
typecheck:
	pnpm typecheck

# 单元测试
test:
	pnpm test

# 单元测试 UI 模式
test-ui:
	pnpm test --ui

# E2E 测试
e2e:
	pnpm e2e

# E2E 测试 UI 模式
e2e-ui:
	pnpm e2e:ui

# 清理构建产物
clean:
	rm -rf .output .wxt dev

# 完整构建
rebuild: clean install build

# 提交到 Chrome Web Store
submit:
	pnpm exec wxt submit