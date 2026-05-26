<!-- Pi: UPDATE MODE -->

This AGENTS.md was generated in a prior session. Your job:

1. Re-explore the project (rg --files, re-read key source files)
2. Check for new or changed .cursorrules, CLAUDE.md, or other AI config files
3. Update every section below with fresh findings — fix stale info, fill gaps
4. Preserve any human-authored notes that don't conflict with current reality
   -->

# 项目代理

**工作空间路径:** `/Volumes/data/working/ai/matrix/neo/ui`
_(注意: Pi 的文件写入/编辑工具默认在不同的目录运行。对于所有文件操作，必须使用以工作空间路径开头的绝对路径！)_

**生成日期:** 2026-05-10

## 技术栈

| 类别       | 名称         | 版本   |
| ---------- | ------------ | ------ |
| 框架       | Next.js      | 16.1.7 |
| UI 库      | React        | 19.2.4 |
| 语言       | TypeScript   | 5.9.3  |
| 样式       | Tailwind CSS | 4.2.1  |
| UI 组件    | shadcn/ui    | 4.7.0  |
| 图标库     | hugeicons    | 1.1.6  |
| 主题       | next-themes  | 0.4.6  |
| 代码检查   | ESLint       | 9.39.4 |
| 代码格式化 | Prettier     | 3.8.1  |

## 目录结构

```
neo/ui/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式 & Tailwind 指令
│   ├── layout.tsx         # 根布局，包含字体和 ThemeProvider
│   ├── page.tsx           # 主页面（目前是模板页面）
│   └── favicon.ico        # 网站图标
│
├── components/             # React 组件
│   ├── ui/                # shadcn/ui 组件（button.tsx）
│   └── theme-provider.tsx # 主题提供者（next-themes）
│
├── lib/                    # 工具函数
│   └── utils.ts           # cn() 工具函数（clsx + tailwind-merge）
│
├── hooks/                  # React Hooks
│   └── .gitkeep
│
├── public/                 # 静态资源
│
├── .next/                  # 构建输出（自动生成）
├── node_modules/
├── package.json
├── next.config.mjs         # Next.js 配置
├── tsconfig.json           # TypeScript 配置
├── components.json         # shadcn/ui 配置
├── eslint.config.mjs       # ESLint 配置
├── postcss.config.mjs      # PostCSS 配置
└── AGENTS.md               # 本文件
```

## 命令

| 操作       | 命令             | 说明                                        |
| ---------- | ---------------- | ------------------------------------------- |
| 安装依赖   | `pnpm install`   | 安装项目依赖                                |
| 开发       | `pnpm dev`       | 启动开发服务器（使用 Turbopack，端口 3300） |
| 构建       | `pnpm build`     | 构建生产版本                                |
| 启动       | `pnpm start`     | 启动生产服务器                              |
| 代码检查   | `pnpm lint`      | 运行 ESLint 检查                            |
| 代码格式化 | `pnpm format`    | 使用 Prettier 格式化代码                    |
| 类型检查   | `pnpm typecheck` | 运行 TypeScript 类型检查                    |

## 约定规范

### 代码风格

- **格式化工具**: Prettier + `prettier-plugin-tailwindcss`
- **代码检查**: ESLint（flat config，使用 `eslint-config-next`）
- **TypeScript**: 启用严格模式

### 命名规范

- 组件: PascalCase（如 `Button.tsx`）
- 工具函数: camelCase（如 `utils.ts`）
- Hooks: 以 `use` 开头（如 `useTheme`）
- CSS 类: Tailwind 工具优先，自定义类用 kebab-case

### shadcn/ui 集成

- **风格预设**: `radix-lyra`
- **基础色**: `neutral`
- **图标库**: `hugeicons`
- **启用 RSC**: 是（Next.js App Router）
- **路径别名**: `@/` → 项目根目录

### 字体配置

- **无衬线字体**: Geist（变量名: `--font-sans`）
- **等宽字体**: JetBrains Mono（变量名: `--font-mono`）

## 关键文件

| 文件                            | 用途                                            |
| ------------------------------- | ----------------------------------------------- |
| `app/layout.tsx`                | 根布局：字体加载、ThemeProvider 包装、HTML 结构 |
| `app/page.tsx`                  | 主页面（模板页面，显示按钮组件示例）            |
| `app/globals.css`               | 全局 Tailwind 样式、CSS 变量、主题令牌          |
| `components/theme-provider.tsx` | next-themes ThemeProvider，用于深色模式切换     |
| `components/ui/button.tsx`      | shadcn/ui Button 组件                           |
| `lib/utils.ts`                  | `cn()` 工具函数：clsx + tailwind-merge 合并类名 |
| `components.json`               | shadcn/ui 配置（风格、别名、组件路径）          |
| `tsconfig.json`                 | TypeScript 配置，包含 `@/*` 路径别名            |

## 避免事项

- **不要破坏 RSC 兼容性** — 项目使用 React Server Components
- **不要删除 theme-provider** — 深色模式依赖它
- **不要修改 tsconfig.json 中的 `baseUrl: "."`** — 会破坏 `@/` 别名
- **避免混用 `import React`** — 项目使用新的 JSX 转换（React 17+）
- **不要添加 CommonJS 语法** — 项目完全使用 ESM
- **避免编辑 `.next/` 目录** — 这是自动生成的构建输出目录

## 备注

### 深色模式

- 使用 `next-themes`，带有 `suppressHydrationWarning`
- 尊重系统 `prefers-colorScheme` 偏好
- 切换快捷键：按 `d` 键

### 父项目上下文

这是 **AI Matrix** 项目（`/Volumes/data/working/ai/matrix/`）的一部分，具体是 `neo` 子目录，包含：

- `ui/` - 本 Next.js 项目（UI/设计原型）
- `design/` - Docusaurus 文档站点（端口 3200）
- `script/` - 工具脚本
- `a.html`, `b.html` - 独立 HTML 文件

### 与父项目的关系

- `neo/ui` 是一个全新的 Next.js 模板，可能用于 UI 原型开发
- `neo/design` 包含产品/UI/技术文档
- ui 和 design 项目之间没有直接依赖关系

### 开发状态

- 目前是 **模板状态** — 除了 shadcn 设置外，只有最少的自定义代码
- 准备好进行组件开发
- 尚未配置 API 路由或数据库
