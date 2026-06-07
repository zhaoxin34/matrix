## 1. 环境准备

- [x] 1.1 安装 rrweb 依赖: `pnpm add rrweb @rrweb/types`
- [x] 1.2 安装 idb 依赖: `pnpm add idb`
- [x] 1.3 验证构建: `make build`

## 2. Content Script 模块划分

### 2.1 recorder.ts - rrweb 录制模块

- [x] 2.1.1 在 `src/content/recorder.ts` 创建录制器模块
- [x] 2.1.2 实现 `startRecording()` 函数初始化 rrweb
- [x] 2.1.3 实现 `stopRecording()` 函数停止录制并返回事件
- [x] 2.1.4 实现 `pauseRecording()` 和 `resumeRecording()` 函数
- [x] 2.1.5 实现事件批处理逻辑（每 500ms 批处理）
- [x] 2.1.6 导出录制器实例供 index.ts 调用

### 2.2 operator.ts - DOM 操作模块

- [x] 2.2.1 在 `src/content/operator.ts` 创建操作执行模块
- [x] 2.2.2 实现 `executeClick(selector)` 函数
- [x] 2.2.3 实现 `executeInput(selector, value)` 函数
- [x] 2.2.4 实现 `executeSubmit(selector)` 函数
- [x] 2.2.5 实现 `executeNavigate(url)` 函数
- [x] 2.2.6 实现操作结果回调机制
- [x] 2.2.7 导出操作执行器供 index.ts 调用

### 2.3 overlay.ts - Shadow DOM 遮罩模块

- [x] 2.3.1 在 `src/content/overlay.ts` 创建遮罩模块
- [x] 2.3.2 实现 `createOverlay()` 创建 Shadow DOM 容器
- [x] 2.3.3 实现录制指示器 UI（Recording/Paused/Idle 状态）
- [x] 2.3.4 实现指示器样式动态更新
- [x] 2.3.5 实现遮罩层显示/隐藏控制
- [x] 2.3.6 实现录制时长显示
- [x] 2.3.7 实现 `destroyOverlay()` 清理函数

### 2.4 iframe-manager.ts - iframe 管理模块

- [x] 2.4.1 在 `src/content/iframe-manager.ts` 创建 iframe 管理模块
- [x] 2.4.2 实现 `createIframe(url)` 创建 iframe 元素
- [x] 2.4.3 实现 `destroyIframe()` 销毁 iframe
- [x] 2.4.4 实现模式切换 URL 参数构建（mode, token）
- [x] 2.4.5 实现 iframe 加载完成回调
- [x] 2.4.6 实现 iframe 通信通道（postMessage）
- [x] 2.4.7 实现 close 按钮和 ESC 快捷键监听

### 2.5 storage.ts - IndexedDB 存储模块

- [x] 2.5.1 在 `src/content/storage.ts` 创建存储模块
- [x] 2.5.2 实现数据库初始化函数 `initDatabase()`
- [x] 2.5.3 实现 `saveRecording(recording)` 函数
- [x] 2.5.4 实现 `getRecording(id)` 函数
- [x] 2.5.5 实现 `listRecordings(limit, offset)` 函数
- [x] 2.5.6 实现 `getUnsyncedRecordings()` 函数
- [x] 2.5.7 实现 `deleteRecording(id)` 函数
- [x] 2.5.8 实现存储配额管理（检查、自动清理）
- [x] 2.5.9 导出存储实例供 index.ts 调用

## 3. Content Script 主模块集成

### 3.1 index.ts 整合

- [x] 3.1.1 导入并初始化 recorder.ts 模块
- [x] 3.1.2 导入并初始化 operator.ts 模块
- [x] 3.1.3 导入并初始化 overlay.ts 模块
- [x] 3.1.4 导入并初始化 iframe-manager.ts 模块
- [x] 3.1.5 导入并初始化 storage.ts 模块
- [x] 3.1.6 实现录制状态管理（idle/recording/paused）
- [x] 3.1.7 实现 Agent 模式状态管理（learn/guide/active）
- [x] 3.1.8 集成消息监听和路由分发
- [x] 3.1.9 使用 chrome.storage.local 持久化状态

## 4. Background 模块增强

### 4.1 background/index.ts 增强

- [x] 4.1.1 完善消息路由逻辑
- [x] 4.1.2 实现 Background ↔ Content Script 双向通信
- [x] 4.1.3 添加离线消息队列机制
- [x] 4.1.4 实现配置同步（chrome.storage.local）

### 4.2 message-router.ts（预留）

- [ ] 4.2.1 创建 `src/background/message-router.ts`（Phase 2 实现）
- [ ] 4.2.2 实现消息类型路由分发
- [ ] 4.2.3 实现消息队列管理

### 4.3 task-scheduler.ts（预留）

- [ ] 4.3.1 创建 `src/background/task-scheduler.ts`（Phase 2 实现）
- [ ] 4.3.2 实现周期任务调度
- [ ] 4.3.3 实现任务队列管理

## 5. Shared 模块完善

### 5.1 types.ts 扩展

- [x] 5.1.1 补充缺失的 MessageType 枚举值
- [x] 5.1.2 添加 Recording, RecordingEvent 类型定义
- [x] 5.1.3 添加 OperationPayload, OperationResult 类型

### 5.2 utils.ts 扩展

- [x] 5.2.1 添加消息创建工厂函数 `createMessage()`
- [x] 5.2.2 添加消息验证函数
- [x] 5.2.3 添加消息序列化/反序列化

## 6. Popup UI 完善

- [x] 6.1 添加"开始"按钮触发 iframe 创建
- [x] 6.2 完善模式选择后的 UI 反馈
- [x] 6.3 添加当前状态显示（录制中/空闲等）
- [x] 6.4 实现 Popup ↔ Background ↔ Content Script 消息传递
- [x] 6.5 测试完整交互流程

## 7. 测试

- [x] 7.1 编写 rrweb 录制单元测试
  - ✅ 22 tests passing
  - 测试覆盖: start/stop/pause/resume, 状态管理, callbacks, sessionId
- [x] 7.2 编写 IndexedDB 存储单元测试
  - ✅ 15 tests passing
  - 测试覆盖: init, save, get, delete, clear, sync
- [x] 7.3 编写消息通信单元测试
  - ✅ 26 tests passing
  - 测试覆盖: MessageType, AgentMode, createMessage, type validation
- [x] 7.4 编写 DOM 操作执行单元测试
  - ✅ 26 tests passing
  - 测试覆盖: click/input/submit/navigate, selectors, edge cases
- [ ] 7.5 手动测试完整录制流程
- [ ] 7.6 手动测试 iframe 嵌入流程

## 8. 文档与构建

- [x] 8.1 更新 README.md 添加 Phase 1 功能说明
- [x] 8.2 更新 AGENTS.md 添加开发指南
- [x] 8.3 最终构建验证: `make build`
- [ ] 8.4 加载扩展到 Chrome 测试

## 测试命令

```bash
# 运行单元测试
make test:run

# 运行单元测试（watch 模式）
make test

# 查看测试覆盖率
pnpm test:run --coverage
```

## 测试文件

| 文件 | 测试数 | 说明 |
|------|--------|------|
| `tests/content/recorder.test.ts` | 22 | 录制模块测试 |
| `tests/content/storage.test.ts` | 15 | 存储模块测试 |
| `tests/shared/types.test.ts` | 26 | 类型定义测试 |
| `tests/content/operator.test.ts` | 26 | DOM 操作测试 |
| **总计** | **89** | |