## 1. 创建新页面

- [x] 1.1 创建 `/auth-bridge/user-info/page.tsx`，从 `/agent-steer/user-info/page.tsx` 迁移代码
- [x] 1.2 创建 `/auth-bridge/test/page.tsx` 测试页面

## 2. 删除旧代码

- [x] 2.1 删除 `/agent-steer/user-info` 目录

## 3. 验证

- [x] 3.1 访问 `/auth-bridge/user-info` 验证页面正常加载（类型检查通过）
- [x] 3.2 访问 `/auth-bridge/test` 验证测试页面功能
- [x] 3.3 验证 postMessage 通信正常

## 4. 相关修复

- [x] 4.1 useWorkspaceStore 添加 persist middleware（持久化 currentWorkspaceId）
- [x] 4.2 header.tsx 添加 workspace 恢复逻辑
- [x] 4.3 user-info 页面添加 workspace 恢复逻辑（支持 iframe）
- [x] 4.4 sidebar-content.tsx 添加 Auth Bridge 测试链接到系统管理菜单
