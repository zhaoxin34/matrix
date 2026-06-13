## Context

Chrome Extension 需要复用 Frontend 的登录态来调用后端 API。目前已有一个实现位于 `/agent-steer/user-info`，但该路径耦合了 agent-steer 模块。需要将其迁移为通用的 `/auth-bridge/user-info`，并提供测试页面。

### 当前状态
- Frontend 已实现 `/agent-steer/user-info`，通过读取 `useAuthStore` 和 `useWorkspaceStore` 获取用户信息
- 使用 `postMessage` 将用户信息传递给 parent window（Chrome Extension popup）
- Chrome Extension 通过隐藏 iframe 嵌入该页面获取认证信息

### 约束
- Frontend 使用 Next.js App Router
- 认证状态存储在 Zustand store 中（`useAuthStore`、`useWorkspaceStore`）
- 需要兼容 Chrome Extension 的 postMessage 通信机制

## Goals / Non-Goals

**Goals:**
- 创建独立的 `/auth-bridge/user-info` 页面，不耦合 agent-steer
- 创建 `/auth-bridge/test` 测试页面，支持手动验证
- 迁移现有功能，删除旧代码

**Non-Goals:**
- 不修改 Frontend 的认证机制（useAuthStore、useWorkspaceStore）
- 不实现独立的 OAuth 或登录流程
- 不修改 Chrome Extension 的其他部分（只更新 iframe src）

## Decisions

### Decision 1: 路径结构

**选择**: `/auth-bridge/user-info` 和 `/auth-bridge/test`

**理由**: 
- `auth-bridge` 命名清晰表达该模块的用途
- 不使用 route group (`(auth)`) 因为这些页面不需要 auth 保护（它们是公开可访问的）
- 与现有 `/agent-steer` 路径解耦

### Decision 2: 复用现有 store

**选择**: 直接使用 `useAuthStore` 和 `useWorkspaceStore`

**理由**:
- 避免重复造轮子
- Frontend 已有完整的认证状态管理
- postMessage 返回的字段与 store 中的字段对应

**返回字段映射**:
| Store 字段 | postMessage 字段 |
|------------|------------------|
| `user.token` | `token` |
| `user.user_id` | `userId` |
| `user.username` | `username` |
| `currentWorkspace.code` | `workspaceCode` |
| `currentWorkspace.id` | `workspaceId` |

### Decision 3: 测试页面设计

**选择**: 独立的测试页面，支持手动测试

**理由**:
- 不依赖 Chrome Extension 即可验证功能
- 提供清晰的 UI 显示当前认证状态
- 支持 postMessage 通信的手动测试

**测试页面功能**:
1. 显示当前登录状态和 workspace 选择状态
2. 模拟 iframe 环境，展示 postMessage 发送和接收

## Risks / Trade-offs

[Risk] Frontend store 结构变化可能导致 postMessage 返回字段不匹配
→ **Mitigation**: postMessage 字段应使用 store 中稳定存在的字段，避免依赖可能变化的内部结构

[Risk] 测试页面与实际 Chrome Extension 环境可能存在差异
→ **Mitigation**: 测试页面主要用于开发调试，最终验证仍需通过 Chrome Extension

## Open Questions

1. 是否需要处理 token 过期自动刷新的场景？
2. 测试页面是否需要支持模拟不同的认证状态（用于开发）？
