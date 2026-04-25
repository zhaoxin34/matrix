# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CDP 前端 - 客户数据平台 Web 应用，使用 Next.js + MUI 构建。

## 常用命令

```bash
make install      # 安装依赖 (pnpm)
make dev          # 启动开发服务器 (http://localhost:3002)
make build        # 生产环境构建
make lint         # 运行 ESLint
make format       # 使用 Prettier 格式化代码
make type-check   # TypeScript 类型检查
```

## 架构设计

### 技术栈

- **框架**: Next.js 16 (App Router)
- **UI 库**: MUI (Material UI) v9 + Emotion
- **状态管理**: Zustand (`src/stores/authStore.ts`)
- **API 客户端**: Axios，模块化组织 (`src/lib/*.ts`)
- **样式**: MUI Theme + CSS Variables

### 目录结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── (authenticated)/   # 需要认证的路由组 (home, projects, admin, etc.)
│   ├── login/              # 登录页
│   ├── register/           # 注册页
│   └── layout.tsx          # 根布局
├── components/
│   └── layout/            # 布局组件 (MainLayout, Sidebar)
├── lib/
│   ├── api.ts              # Axios 实例 + 认证拦截器
│   ├── projectApi.ts       # 项目相关 API
│   ├── orgApi.ts           # 组织相关 API
│   └── skillApi.ts         # 技能库 API
├── stores/
│   ├── authStore.ts        # 认证状态 (Zustand + persist)
│   └── projectStore.ts     # 项目状态
├── theme/
│   └── theme.ts            # MUI 主题配置
└── types/
    └── user.ts             # 用户类型定义
```

### 认证流程

1. 登录页提交 phone + password 到 `/api/v1/auth/login`
2. 成功后获取 access_token 和 refresh_token，存储到 localStorage
3. Axios 拦截器自动添加 Authorization header
4. 401 响应时自动尝试刷新 token
5. `(authenticated)/layout.tsx` 检查 isAuthenticated 状态进行路由保护

### API 代理配置

Next.js 配置了 rewrites 将 `/api/*` 代理到 `http://localhost:8001/api/*`（后端）。

### 响应格式

所有 API 返回统一格式：
```json
{ "code": 0, "message": "ok", "data": {}, "traceId": "...", "timestamp": ... }
```

## 测试用户

- username: 13800138002
- password: abcd1234

## 注意事项

- 开发服务器运行在 **端口 3002**（不是 3001）
- `data-testid` 属性用于 e2e 测试定位元素
- 使用 `make format` 格式化代码，ESLint 只检查不修复
