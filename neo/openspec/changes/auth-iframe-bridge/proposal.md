## Why

Chrome Extension 需要复用 Frontend 的登录态来调用后端 API。目前通过隐藏 iframe 嵌入 Frontend 页面来获取用户信息，但该功能耦合在 `/agent-steer/user-info` 路径下，不便于其他功能复用。需要将认证桥接功能抽取为独立的通用模块，并提供测试页面简化开发调试。

## What Changes

- 创建独立的 `/auth-bridge/user-info` 页面，替代现有的 `/agent-steer/user-info`
- 创建 `/auth-bridge/test` 测试页面，用于手动验证 postMessage 通信，无需每次通过 Chrome 插件测试
- 删除 `/agent-steer/user-info` 旧代码
- 更新 Chrome Extension 的 iframe 嵌入 URL 配置

## Capabilities

### New Capabilities

- `auth-iframe-bridge`: 通过隐藏 iframe 复用 Frontend 登录态的认证桥接机制，支持获取用户信息（token、userId、username、workspaceCode、workspaceId）

### Modified Capabilities

- 无

## Impact

| 影响范围 | 说明 |
|----------|------|
| **Frontend** | 新增 `/auth-bridge/*` 路由，删除 `/agent-steer/user-info` |
| **Chrome Extension** | 更新 iframe src 从 `/agent-steer/user-info` 到 `/auth-bridge/user-info` |
| **技术设计文档** | 已存在于 `design/docs/technical/auth/iframe-bridge.md` |
