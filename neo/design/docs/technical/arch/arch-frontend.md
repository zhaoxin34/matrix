---
id: arch-frontend
title: Frontend 工程架构
sidebar_position: 2
---

# Frontend 工程架构

本文档定义 Neo Agent 前端工程的架构设计，基于 Neo UI 原型项目技术栈构建，支持独立模式和嵌入模式两种运行方式。

## 1. 技术栈

### 1.1 技术选型

> 继承 `neo/ui` 项目技术栈。

| 类别 | 技术 | 版本 |
|------|------|------|
| **框架** | Next.js (App Router) + Turbopack | 16.x |
| **UI 库** | React | 19.x |
| **语言** | TypeScript | 5.x |
| **样式** | Tailwind CSS | 4.x |
| **组件库** | shadcn/ui | 4.x |
| **状态管理** | Zustand | latest |
| **图标** | hugeicons | latest |
| **主题** | next-themes | latest |
| **录像** | rrweb | 2.x |
| **包管理** | pnpm | latest |
| **代码检查** | ESLint | 9.x |
| **格式化** | Prettier | 3.x |

### 1.2 技术说明

| 技术 | 说明 |
|------|------|
| **Next.js App Router** | 支持 React Server Components，文件路由，API Routes |
| **shadcn/ui** | 基于 Radix UI 的无头组件库，按需添加组件 |
| **Zustand** | 轻量状态管理，适合 iframe 内外通信场景 |
| **rrweb** | 录制和回放用户操作，支持录像的存储和播放 |

---

## 2. 目录结构

### 2.1 整体结构

> 目录结构基于 `neo/ui` 项目构建，参考其技术栈和配置。

```
frontend/
├── app/                        # Next.js App Router
│   ├── page.tsx               # 首页
│   ├── layout.tsx              # 根布局
│   ├── globals.css             # 全局样式
│   │
│   ├── login/                  # 登录页
│   ├── register/               # 注册页
│   │
│   ├── admin/                  # 管理后台（可选）
│   │   └── ...
│   │
│   ├── workspace/              # Workspace 页面
│   │   └── ...
│   │
│   ├── agent/                  # Agent 路由（结构待重新设计）
│   │
│   └── api/                    # API Routes（可选）
│
├── components/                 # React 组件
│   ├── ui/                     # shadcn/ui 组件
│   ├── layout/                 # 布局组件
│   └── shared/                 # 共享组件
│
├── lib/                      # 工具函数
│   ├── api/                    # API 客户端
│   │   ├── client.ts           # HTTP 客户端配置
│   │   └── *.ts                # API 模块
│   ├── utils.ts               # 通用工具（cn 等）
│   └── constants.ts           # 常量定义
│
├── stores/                    # Zustand Store
│   └── *.ts                    # 状态管理模块
│
├── hooks/                     # 自定义 Hooks
│   └── *.ts                    # 功能模块 Hooks
│
├── types/                     # TypeScript 类型定义
│   └── *.ts                    # 类型定义模块
│
├── mockdata/                   # Mock 数据（开发用）
│
├── public/                     # 静态资源
│
├── tests/                     # 测试文件（可选）
│
├── package.json                # 继承 ui 项目配置
├── tsconfig.json               # 继承 ui 项目配置
├── next.config.mjs             # 继承 ui 项目配置
├── tailwind.config.ts          # 继承 ui 项目配置
├── components.json             # shadcn/ui 配置
├── eslint.config.mjs           # 继承 ui 项目配置
└── Makefile
```

### 2.2 目录说明

| 目录 | 说明 |
|------|------|
| `app/` | Next.js App Router，参考 ui 项目结构 |
| `components/ui/` | shadcn/ui 组件，通过 `components.json` 管理 |
| `lib/` | 工具函数，参考 ui 项目 `lib/` 配置 |
| `hooks/` | 自定义 Hooks，参考 ui 项目 `hooks/` 配置 |
| `stores/` | Zustand store（新增，需集成到 ui 项目） |
| `types/` | TypeScript 类型定义 |
| `mockdata/` | Mock 数据，参考 ui 项目配置 |

---

## 3. 部署配置

### 3.1 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动开发服务器 (port 3300) |
| `pnpm build` | 构建生产版本 |
| `pnpm lint` | 代码检查 |
| `pnpm format` | 代码格式化 |
| `pnpm typecheck` | TypeScript 检查 |

### 3.2 嵌入模式部署

嵌入模式下，Frontend 作为静态资源部署，需要配置正确的 CORS 头部：

```
Content-Security-Policy: frame-ancestors *
Access-Control-Allow-Origin: *
```

---

## 🔗 相关文档

- [ 技术架构总览 ](./arch-overview)
- [ backend 工程架构 ](./arch-backend)
- [ chrome-extension 工程架构 ](./arch-chrome-extension)
