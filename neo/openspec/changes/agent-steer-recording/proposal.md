# Proposal: Agent Steer Recording（Chrome 扩展端录像管理）

## Why

Agent Steer 产品线需要在用户操作目标软件时采集浏览器行为录像，作为后续"自主驱动"能力的学习素材。当前后端已经具备录像创建、分段上传、查询、回放等完整 API（由 `recording-management` / `recording-upload` / `recording-playback` 三个 capability 覆盖），但 **chrome 扩展端没有任何录像采集入口**——`rrweb-recording` capability 描述的是后端的录像存储逻辑，不负责扩展端的录制控制与上传。

本次 change 要补齐这一缺口：在 chrome 扩展端提供 popup（用户交互）+ content script（采集执行）的完整录像管理能力，复用后端既有 API 完成持久化，让 Agent Steer 产品形态闭环。

## What Changes

- **新增** chrome 扩展端 capability `agent-steer-recording`，覆盖：
  - popup 提供 4 状态 UI（空闲 / 录制中 / 已暂停 / 上传中 / 上传成功）
  - popup 通过自定义消息协议向当前标签页的 content script 发起 `start` / `pause` / `resume` / `stop` / `fetch` 命令
  - content script 启动 rrweb 采集、按 10 分钟自动切分 segment、写入 IndexedDB
  - popup 负责调用后端 4 个 API 完成上传：`POST /workspaces/{code}/recordings` → `POST /recordings/{uid}/segments` → `POST /recordings/{uid}/segments/presigned` → `PUT /recordings/{uid}`
  - 上传成功后清理本地 IndexedDB 数据
- **不修改** 后端任何 capability——`recording-upload` / `recording-management` / `recording-playback` 保持原样，本 change 仅作为其消费方
- **不修改** `rrweb-recording` capability——它描述的是后端的存储实现，与扩展端录制控制无 spec 级冲突
- **复用** 既有 `message-communication` 和 `indexeddb-storage` 两个 chrome 扩展基础设施 capability（消息抽象与 IndexedDB 抽象），本次 change 在其之上定义"录像业务"的具体行为

### 关键决策（已在 review 时确认）

| 决策 | 取值 | 理由 |
|------|------|------|
| 录制数据持久化 | IndexedDB（不存内存） | 用户可能刷新 / 关闭 popup / 浏览器崩溃，纯内存会丢数据 |
| 分段时机 | 录制每满 10 分钟、pause、stop 时各切一个 segment | 与产品文档一致，保证任意暂停点都能上传已落盘数据 |
| 上传时机 | 用户点"上传"时由 popup 一次性上传所有 segment | 与产品 UI 流程一致；录制过程中不自动上传 |
| 上传后清理 | 成功后清除本地 IndexedDB 数据 | 避免本地堆积无用数据 |
| 录制作用域 | per-tab（每个标签页独立录制） | 与 chrome.tabs.sendMessage 语义对齐；切换标签页不影响当前录制 |
| 工作区标识 | 从 `chrome.storage.local` 的 `workspace_code` 配置读取 | 与设计文档 §2.1 一致 |

## Capabilities

### New Capabilities

- `agent-steer-recording`：chrome 扩展端软件操作录像管理能力，覆盖 popup 交互、content script 录制、IndexedDB 分段、上传到后端 4 个 API 的完整链路

### Modified Capabilities

无。

说明：本次 change 的实现会调用后端 `recording-upload` 和 `recording-management` 已定义的接口（创建录像、创建 segment、presigned URL、标记 completed），但**后端 capability 本身不需要任何改动**——本 change 是这些 capability 的纯消费方。

## Impact

- **chrome-extension 目录**：本次主要工作面，需要新增 popup、content script、消息协议实现、IndexedDB 业务封装、上传服务等模块
- **后端零改动**：所有接口已存在（`recording-upload` §Create recording / §Upload segment / §Get presigned upload URL；`recording-management` §Complete recording）
- **前端 neo/frontend 零改动**：用户点"查看回放"时跳转即可，`recording-playback` capability 已覆盖回放页面
- **配置项**：popup 需要从 `chrome.storage.local` 读取 `workspace_code`、`api_base_url`、`frontend_base_url`（这些是 Agent Steer 配置项，由 §2.1 系统配置管理项定义，本 change 不实现配置管理 UI，只消费）
- **依赖**：chrome-extension 已有 rrweb v2.0.0-alpha.20、@webext-core/messaging、@wxt-dev/storage，无需新增 npm 包