# 项目代理 - 前端工程师

**工作空间路径:** `/Volumes/data/working/ai/matrix/neo/frontend`
**生成日期:** 2026-05-26

---

## 项目概述

Neo 是一个 AI 协作平台，前端使用 Next.js + React + TypeScript 构建，运行在端口 3300。

---

## 技术栈

| 类别       | 名称             | 版本      |
| ---------- | ---------------- | --------- |
| 框架       | Next.js          | 16.1.7    |
| UI 库      | React            | 19.2.4    |
| 语言       | TypeScript       | 5.9.3     |
| 样式       | Tailwind CSS     | 4.2.1     |
| UI 组件    | shadcn/ui        | 4.7.0     |
| 图标库     | hugeicons        | 1.1.6     |
| 主题       | next-themes      | 0.4.6     |
| 表单       | react-hook-form  | 7.75.0    |
| 表单验证   | zod              | 3.25.76   |
| 代码检查   | ESLint           | 9.39.4    |
| 代码格式化 | Prettier         | 3.8.1     |

---

## 目录结构

```
frontend/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 根布局 (ThemeProvider, Sidebar, Header)
│   ├── page.tsx                      # 首页 (组件演示入口)
│   ├── globals.css                   # 全局样式 & Tailwind 指令
│   ├── demo/                         # 演示页面
│   │   ├── page.tsx                  # 演示首页
│   │   ├── form/page.tsx             # 表单演示
│   │   └── theme/page.tsx            # 主题演示
│   ├── admin/                        # 管理后台
│   │   ├── agent-prototype/          # Agent 原型管理
│   │   ├── org-structure/            # 组织架构
│   │   ├── users/                    # 用户管理
│   │   ├── skills/                   # 技能管理
│   │   └── workspace/                # 工作区管理
│   └── workspace/                     # 工作区功能
│       ├── [workspace_code]/         # 动态工作区
│       │   ├── agents/               # Agent 管理
│       │   ├── embedded-site/        # 嵌入式网站
│       │   └── list/                 # 列表页
│       └── list/                     # 工作区列表
│
├── components/                       # React 组件
│   ├── ui/                           # shadcn/ui 组件 (26个)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── sidebar.tsx
│   │   └── ... (更多)
│   ├── theme-provider.tsx            # 主题提供者
│   ├── app-sidebar.tsx               # 应用侧边栏
│   ├── header.tsx                    # 头部导航
│   ├── sidebar-content.tsx           # 侧边栏内容
│   ├── sidebar-header.tsx            # 侧边栏头部
│   ├── sidebar-footer.tsx            # 侧边栏底部
│   ├── agent-factory/                # Agent 工厂组件
│   │   ├── agent-factory-card.tsx
│   │   ├── agent-factory-header.tsx
│   │   ├── prototype-picker/         # 原型选择器
│   │   ├── skill-picker/             # 技能选择器
│   │   └── advanced-config/           # 高级配置
│   ├── agent-prototype/              # Agent 原型组件
│   │   ├── agent-prototype-card.tsx
│   │   ├── agent-prototype-header.tsx
│   │   ├── delete-dialog.tsx
│   │   ├── enable-disable-dialog.tsx
│   │   ├── markdown-editor.tsx
│   │   ├── publish-dialog.tsx
│   │   └── versions-dialog.tsx
│   ├── embedded-site/                # 嵌入式网站组件
│   │   ├── embedded-site-card.tsx
│   │   ├── embedded-site-form.tsx
│   │   ├── embedded-site-header.tsx
│   │   └── embedded-site-list.tsx
│   └── workspace/                    # 工作区组件
│       ├── workspace-card.tsx
│       ├── workspace-form.tsx
│       ├── workspace-header.tsx
│       ├── workspace-member-list.tsx
│       └── workspace-stats.tsx
│
├── hooks/                            # React Hooks
│   └── use-mobile.ts                 # 移动设备检测
│
├── lib/                              # 工具函数
│   └── utils.ts                      # cn() 工具函数
│
├── public/                           # 静态资源
│
├── Makefile                          # 构建命令
├── next.config.mjs                   # Next.js 配置
├── tsconfig.json                     # TypeScript 配置
├── components.json                   # shadcn/ui 配置
├── eslint.config.mjs                 # ESLint 配置
└── package.json                      # 依赖管理
```

---

## 命令

| 操作       | 命令                        | 说明                |
| ---------- | --------------------------- | ------------------- |
| 安装依赖   | `pnpm install`              | 安装项目依赖        |
| 开发       | `pnpm dev`                  | 启动开发服务器 (Turbopack, 端口 3300) |
| 构建       | `pnpm build`                | 构建生产版本        |
| 启动       | `pnpm start`                | 启动生产服务器      |
| 代码检查   | `pnpm lint`                 | 运行 ESLint 检查    |
| 代码格式化 | `pnpm format`                | 使用 Prettier 格式化 |
| 类型检查   | `pnpm typecheck`            | 运行 TypeScript 类型检查 |

---

## 约定规范

### 代码风格

- **格式化工具**: Prettier + `prettier-plugin-tailwindcss`
- **代码检查**: ESLint (flat config)
- **TypeScript**: 严格模式

### 命名规范

- 组件: PascalCase (如 `Button.tsx`)
- 工具函数: camelCase (如 `utils.ts`)
- Hooks: 以 `use` 开头 (如 `useIsMobile`)
- CSS 类: Tailwind 工具优先

### shadcn/ui 集成

- **风格预设**: `radix-lyra`
- **基础色**: `neutral`
- **图标库**: `hugeicons`
- **路径别名**: `@/*` → 项目根目录

### 主题配置

- 使用 `next-themes`，支持深色/浅色模式切换
- 默认主题: `system` (跟随系统)
- 切换快捷键: 按 `d` 键
- 使用 oklch 颜色空间

### 测试属性

- 必须为可操作元素添加 `data-testid` 属性，便于 e2e 测试

### 组件开发

- 使用 React Server Components (RSC) 优先
- 交互组件添加 `"use client"` 指令
- 表单使用 `react-hook-form` + `zod` 验证

---

## 关键文件

| 文件                                      | 用途                                |
| ----------------------------------------- | ----------------------------------- |
| `app/layout.tsx`                          | 根布局: 主题、侧边栏、头部          |
| `app/page.tsx`                            | 首页                                |
| `app/globals.css`                         | 全局样式、Tailwind 变量             |
| `components/theme-provider.tsx`           | next-themes 主题提供者              |
| `components/app-sidebar.tsx`             | 应用侧边栏组件                      |
| `components/header.tsx`                   | 顶部导航头                          |
| `lib/utils.ts`                            | `cn()` 类名合并工具                 |
| `components.json`                         | shadcn/ui 配置                      |
| `hooks/use-mobile.ts`                     | 移动设备检测 Hook                   |

---

## 避免事项

- **不要破坏 RSC 兼容性** — 项目使用 React Server Components
- **不要删除 theme-provider** — 深色模式依赖它
- **不要修改 tsconfig.json 中的 `baseUrl: "."`** — 会破坏 `@/` 别名
- **避免混用 `import React`** — 使用新的 JSX 转换
- **不要添加 CommonJS 语法** — 项目完全使用 ESM
- **不要编辑 `.next/` 目录** — 自动生成的构建输出

---

## 父项目上下文

**项目路径:** `/Volumes/data/working/ai/matrix/neo`

| 目录       | 说明                    |
| ---------- | ---------------------- |
| `./design` | Docusaurus 文档站点     |
| `./ui`     | 本 Next.js 项目        |
| `./backend`| Python FastAPI 后端    |
| `./chrome-extension` | Chrome 扩展程序 |

---

## 开发状态

- 项目结构已完善，包含完整的管理后台页面
- 30 个页面/组件文件
- 已配置完整的主题系统、表单验证、UI 组件库
- 准备好进行功能开发和迭代
