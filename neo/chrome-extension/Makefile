.PHONY: install dev dev-firefox build build-firefox zip zip-firefox lint format typecheck test clean rebuild submit

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

# 运行测试
test:
	pnpm test

# 清理构建产物
clean:
	rm -rf .output .wxt dev

# 完整构建
rebuild: clean install build

# 提交到 Chrome Web Store
submit:
	pnpm exec wxt submit