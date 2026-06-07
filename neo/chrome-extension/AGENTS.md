# Project Agent

**Workspace Path:** `/Volumes/data/working/ai/matrix/neo/chrome-extension`
*(Note to Pi: Your file write/edit tools run in a different directory by default. You MUST use absolute paths starting with the Workspace Path above for ALL file operations!)*

<!-- Pi: before writing anything, explore this project:
  1. Read package.json / pyproject.toml / Cargo.toml / go.mod — identify stack and versions
  2. Scan directory structure: rg --files | head -60
  3. Read 3-5 key source files to understand patterns and conventions
  4. Check for .cursorrules, CLAUDE.md, .eslintrc, prettier.config — existing AI/style config
  Then fill in each section below based on what you actually find.
  Adapt or add sections if the project has unique needs.
-->

**Generated:** 2026-06-07

## Stack

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | ^5.5.0 | 主语言 |
| Vite | ^5.4.0 | 构建工具 |
| vite-plugin-crx | - | Chrome 扩展构建 |
| Manifest V3 | - | Chrome 扩展规范 |
| rrweb | 2.0.0-alpha.20 | 用户行为录制 |
| idb | ^8.0.0 | IndexedDB 封装 |
| ESLint | ^9.0.0 | 代码检查 |
| Prettier | ^3.0.0 | 代码格式化 |

## Structure

```
chrome-extension/
├── src/
│   ├── background/        # Service Worker 后台脚本
│   │   └── index.ts      # 消息路由、状态管理
│   ├── content/          # Content Script 内容脚本
│   │   └── index.ts      # 录制控制、DOM 操作、iframe 管理
│   ├── extension/        # 扩展 UI（弹窗和选项页）
│   │   ├── popup.ts      # 弹窗界面
│   │   └── options.ts    # 选项设置页面
│   └── shared/           # 共享模块
│       ├── types.ts      # 类型定义和消息类型枚举
│       ├── utils.ts      # 工具函数（日志、节流、防抖等）
│       └── index.ts # 导出入口
├── public/               # 静态资源（图标、HTML 模板）
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   ├── popup.html
│   └── options.html
├── scripts/              # 构建脚本
│   └── copy-assets.js    # 复制静态资源到 dist
├── dist/                 # 构建输出目录
├── hooks/                # Git hooks 配置
├── manifest.json         # Chrome 扩展清单
├── vite.config.ts        # Vite 配置
├── tsconfig.json        # TypeScript 配置
├── package.json
└── Makefile              # 构建命令
```

## Commands

| Action | Command | 说明 |
|---------|---------|------|
| Install | `make install` | 安装依赖（pnpm install） |
| Dev | `make dev` | 监听模式构建（开发用） |
| Build | `make build` | 生产环境构建 |
| Test | - | 暂无测试命令 |
| Lint | `make lint` | ESLint 检查 |
| Format | `make format` | Prettier 格式化 |
| Typecheck | `make typecheck` | TypeScript 类型检查 |
| Clean | `make clean` | 清理构建产物 |
| Load | `make load` | 显示加载扩展说明 |

## Conventions

### 代码风格
- **命名规范**：
  - 类型/接口：`PascalCase`（如 `AgentConfig`）
  - 函数/变量：`camelCase`（如 `createMessage`）
  - 常量：`UPPER_SNAKE_CASE`（如 `DEFAULT_CONFIG`）
  - 枚举值：`PascalCase`（如 `AgentMode.LEARN`）
- **注释规范**：使用 JSDoc 风格注释
- **日志前缀**：使用 `createLogger` 创建带前缀的日志器

### 消息通信
- 使用 `createMessage()`工厂函数创建消息
- 消息包含：`type`, `payload`, `timestamp`, `messageId`, `correlationId`
- 通过 `chrome.runtime.sendMessage` 在组件间通信

### 模块路径
- 使用 `@shared/*` 别名引用共享模块
- 配置在 `tsconfig.json` 和 `vite.config.ts` 中

### 构建输出
- Vite 输出到 `dist/` 目录
- 入口文件直接输出：`background.js`, `content.js`, `popup.js`, `options.js`
- 资源文件输出到 `assets/` 子目录
- 使用 ES 模块格式

## Key Files

| 文件 | 作用 |
|------|------|
| `manifest.json` | Chrome 扩展配置（权限、入口、图标） |
| `src/content/index.ts` | 内容脚本核心：录制控制、DOM 操作、Shadow DOM overlay、iframe 管理 |
| `src/background/index.ts` | Service Worker：消息路由、状态管理、配置存储 |
| `src/shared/types.ts` | 共享类型定义：消息类型枚举、配置接口、消息工厂函数 |
| `src/shared/utils.ts` | 工具函数：日志器、节流/防抖、ID 生成器 |
| `vite.config.ts` | Vite 构建配置：多入口打包、路径别名 |
| `public/popup.html` | 弹窗 HTML 模板 |
| `public/options.html` | 选项页 HTML 模板 |

## What to Avoid

1. **不要直接修改 `dist/` 目录** - 这是构建输出目录，所有源文件在 `src/` 中
2. **不要使用 CommonJS** - 项目使用 ES 模块格式
3. **不要省略消息的 `return true`** - 异步响应必须返回 true
4. **不要在 content script 中直接操作 DOM** - 使用 `document.querySelector()` 和事件派发
5. **不要修改构建入口配置** - 在 `vite.config.ts` 中修改
6. **不要使用 `var`** - 使用 `let` 或 `const`

## Notes

### Chrome 扩展特定
- Manifest V3 要求使用 Service Worker 替代背景页
- Content Script 运行在目标页面上下文中，无法访问扩展上下文
- 使用 `chrome.storage.local` 存储配置
- iframe 需要添加到 `web_accessible_resources` 才能被页面访问

### 通信机制
- **Content↔ Background**：使用 `chrome.runtime.sendMessage`
- **Iframe ↔ Content**：使用 `window.postMessage`
- **Content ↔ Background**（中转）：使用 `BroadcastChannel`

### 模式说明
- `AgentMode.LEARN`：学习模式 - 录制用户行为
- `AgentMode.GUIDE`：引导模式 - 辅助用户操作
- `AgentMode.ACTIVE`：主动模式 - AI 主动执行操作

### 环境配置
- 前端 URL 默认：`http://localhost:3300`
- 后端 URL 默认：`http://localhost:8000`
- 可通过选项页或环境变量配置

### 依赖注入
- 使用 `idb` 库封装 IndexedDB 操作
- 使用 `rrweb` 进行用户行为录制