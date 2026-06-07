## Why

Chrome Extension 需要实现核心的录制和嵌入功能，作为 Neo Agent 的学习模式基础。目前 Extension 骨架已完成，但缺少关键的 rrweb 录制集成和 Neo 前端 iframe 嵌入能力，无法支持用户的学习和引导场景。

## What Changes

- 集成 rrweb 录制引擎到 Content Script，支持用户操作录制
- 实现 Neo 前端 iframe 嵌入，用户可通过 Popup 激活 Agent
- 添加 IndexedDB 本地存储，支持离线录制数据缓存
- 完善 Extension 与 iframe 之间的消息通信机制
- 添加录制状态指示器（Shadow DOM Overlay）

## Capabilities

### New Capabilities

- `rrweb-recording`: 集成 rrweb 录制引擎，实现用户操作的实时录制，包括事件捕获、本地存储和录像回放基础能力
- `iframe-embedding`: Neo 前端 iframe 动态嵌入，支持模式切换（学习/引导/主动模式）和与 Content Script 的双向通信
- `indexeddb-storage`: 本地 IndexedDB 存储层，支持录制事件持久化、离线缓存和数据同步队列
- `message-communication`: Extension 内部组件（Background、Content Script、Popup、iframe）之间的标准化消息通信

### Modified Capabilities

（无）

## Impact

- **代码目录**: `chrome-extension/src/content/` - 主要实现区域
- **依赖**: `rrweb`, `rrdom`, `idb` (IndexedDB wrapper)
- **API**: 暂不涉及后端 API对接（Phase 1 只做本地功能）
- **测试**: 需要添加 e2e 测试用例覆盖录制流程和 iframe 通信