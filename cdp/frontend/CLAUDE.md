# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目

CDP 前端 - React + TypeScript + Vite 的客户数据平台前端应用。

## 常用命令

```bash
make install      # npm install
make dev          # 启动开发服务器 (http://localhost:3001)
make build        # 生产环境构建
make lint         # 运行 ESLint
make format       # 使用 Prettier 格式化
make type-check   # TypeScript 类型检查
make test         # 运行 Vitest 测试
```

## 架构

### 目录结构

```
src/
├── api/           # Axios 客户端和 API 模块 (modules/)
├── components/    # 组件 (含 layout/MainLayout)
├── hooks/         # 自定义 React Hooks
├── pages/         # 页面组件
│   ├── Login.tsx, Register.tsx, Home.tsx
│   ├── Customer.tsx, UserProfile.tsx
│   ├── OrgStructure/, SkillLibrary/, UserManagement/
│   └── ProjectManagement/
├── stores/        # Zustand 状态管理 (authStore.ts, projectStore.ts)
├── types/         # TypeScript 类型定义
└── styles/         # 全局样式
```

### 状态管理

- **authStore**: 用户认证状态 (user, accessToken, refreshToken)
- **projectStore**: 项目上下文 (currentProject)
- 使用 zustand/persist 持久化到 localStorage

### API 层

- Axios 实例配置在 `api/axios.ts`
- 响应拦截器处理：
  - 统一错误码 (code !== 0)
  - Token 自动刷新
  - 401 重定向登录
- API 模块在 `api/modules/` (user.ts, project.ts 等)

### 路由保护

- `GuestRoute`: 未登录可访问
- `AuthRoute`: 需要登录
- `AdminRoute`: 需要管理员权限
- `TokenValidator`: 自动刷新 token 并验证用户

### 数据测试属性

页面元素使用 `data-testid` 属性便于 e2e 测试，格式如 `data-testid="inp-username"`。

## 配置

- `@` alias 指向 `src/`
- Vite 开发服务器端口: `3001`
- API 代理: `/api` → `http://localhost:8001`
