---
id: doc-sync-chat-button-and-side-panel-split
title: "[Tracker] 文档同步：ChatButton + Side Panel 拆分"
sidebar: false
sidebar_position: 99
author: 自动生成
created: 2026-07-06
updated: 2026-07-06
tags: [Tracker, Agent Steer, ChatButton, Side Panel]
---

# 文档同步追踪：ChatButton + Side Panel 拆分

> **Status**: ✅ 已完成（5/5 + 类 A 残留清理）
>
> **目的**：跟踪 `docs/technical/agent-steer/` 下设计文档相对于"ChatButton + Side Panel 拆分"已实现架构的同步进度。
>
> **关联 change 归档**：`/Volumes/data/working/ai/neo-agents/openspec/changes/archive/2026-07-05-chat-button-and-side-panel-split/`
>
> **涉及的代码包**：`extension/`、`agent-ui-chat/`
>
> **执行约定**：每步只能改一个文件；改之前先描述改动、等用户确认 OK 才动手；改完给变更摘要。

---

## 改动总览

| Step | 改动文件 | 改动范围 | 状态 | 最后更新 |
|------|---------|----------|------|----------|
| 1 | `docs/technical/agent-steer/agent-chat-integration.md` | 整篇重写（front matter + §1 - §11） | ✅ DONE | 2026-07-06 |
| 2 | `docs/technical/agent-steer/browser-bridge.md` | §1.2 + §2 + §3（关系图 + 组件职责） | ✅ DONE | 2026-07-06 |
| 3 | `docs/technical/agent-steer/browser-bridge.md` | §5 连接流程（§5.1 时序图 + §5.2 关键时序点 + §5.3 关闭流程） | ✅ DONE | 2026-07-06 |
| 4 | `docs/technical/agent-steer/browser-bridge.md` | §7 控制面板章节重写 + §12 文件结构 + §14 版本历史 | ✅ DONE | 2026-07-06 |
| 5 | `docs/technical/agent-steer/browser-bridge-protocol.md` | §11 时序图 + §15 版本历史 | ✅ DONE | 2026-07-06 |

---

## Step 1 — `agent-chat-integration.md` 整篇重写

**目标**：让"集成 agent-ui-chat"的设计文档反映 ChatButton + Side Panel 拆分，而非 ChatLauncher content script overlay 时代。

**改动范围**：front matter + §1 项目背景 + §2 已明确的约束 + §3 集成架构 + §4 功能需求 + §5 UI 界面设计约束 + §6 技术实现要点 + §7 开放问题 + §9 开发任务拆分 + §10 已有工作 + §11 验收标准

**保守原则**：不改 §8 相关文档链接章节

**前置条件**：完成此步骤后才会进入 Step 2。

**验收清单**：
- [x] front matter `updated` / `version` 同步（updated=2026-07-06，version=3.0.0）
- [x] §1.2 MVP 范围行从"Content Script 渲染"改为"ChatButton overlay + Side Panel"
- [x] §3 关系图含 SW + ChatButton(content) + Side Panel + MAIN world bb-client（含 mermaid 图）
- [x] §6 技术实现要点反映 SW session 编排 + Side Panel mount（4 个新小节：SW 编排 / useChatSession / session 持久化 / bb-client 注入）
- [x] §10 已有工作说明 ChatLauncher 标 `@deprecated`，新增 ChatButton / useChatSession / tabCloseCleanup
- [x] §11 验收涵盖 session 复用、tab 关闭清理、page 导航存活

**实际改动摘要**：
- 新增段落：§3.2 关系图（mermaid）；§6.1 SW session 编排表格 + "为什么用 OPEN_CHAT_PANEL_FOR_MY_TAB" 说明；§6.2 useChatSession 4 职责 + 实现文件；§6.3 session 持久化双 key 表（`String(tabId)` + `__associatedWebTab__`）；§6.4 bb-client 注入两阶段代码示例
- 删除段落：旧 §6.1 "Content Script 中的 React 问题"（旧架构才有）；旧 §6.3 重复 bb-client 描述；旧 ChatLauncher 完成时的 ChatLauncher 段
- 修改段落：front matter（version 2.0.0 → 3.0.0，updated + tags）；§1.2 MVP 列表；§2.1 auth vs chat storage 说明；§2.2 chat UI 集成位置拆 ChatButton / ChatWindow；§3.1 数据流全改写为 7 步；§4.1 加 3 行（新需求）；§5 拆 §5.1 ChatButton 位置 + §5.2 ChatWindow 位置；§7 开放问题拆 "已决" + "待定"；§9 Phase 1-4 标 ✅；§10 已有工作拆 3 段；§11 验收全勾上并加 4 条新验收

---

## Step 2 — `browser-bridge.md` 关系图 + 组件职责

**目标**：修正"bb-client 在 content script 里"的核心约束；替换"Agent 控制面板 + 聊天 UI"整节。

**改动范围**：
- §1.2 目标：去掉"Shadow DOM Agent 控制面板"错误表述
- §2 核心约束表：bb-client 的位置从"content script"改为"page MAIN world（由 SW executeScript 注入）"
- §2.1 关系图（mermaid）：SW 居中、bb-client 在 MAIN world、ChatButton 在 content Shadow DOM、ChatWindow 在 Side Panel
- §3.1 bb-client 章节：重新描述位置 + 注入时机（SW `chrome.scripting.executeScript({ world: 'MAIN' })` 在 SESSION_READY 后触发）
- §3.2 "Agent 控制面板 + 聊天 UI（Shadow DOM）"：整节重写为 ChatButton（page）+ ChatWindow（Side Panel）+ MetricsStore 跨上下文镜像

**保守原则**：
- §3.3 BB Router / §3.4 rpc-manager / §3.5 browser-tool 不动
- §4 - §14 不在本步范围内

**前置条件**：Step 1 完成

**验收清单**：
- [x] §2 关系图含 SW + ChatButton + Side Panel + MAIN world bb-client 四件套
- [x] §3.1 不再说"在 agent-steer content script 里"
- [x] §3.2 没有"控制面板 UI"+"调试入口"+"用户控制按钮"的旧描述

**实际改动摘要**：
- 新增段落：无新增大段；§2 核心约束表加一行 "chat UI 拆分两处"；§3.2 精简为 1 行 pointer 到 `agent-chat-integration.md`
- 删除段落：§3.2 整节"Agent 控制面板 + 聊天 UI（Shadow DOM）"（约 7 行 bullet）—— 控制面板已不存在；聊天 UI 拆分在 `agent-chat-integration.md` 已述
- 修改段落：§1.2 #3 改 chat UI 拆分；§2 表"bb-client 在 content script" 改 "bb-client 由 SW 注入 MAIN world"；§2.1 关系图整张重画（Popup→CS→Shadow DOM 改为 SW 居中 + Page ISOLATED/MAIN + Side Panel 4 层）；§3.1 bb-client 6 条 bullet 合并为 1 段（注入方式 + 包 + 协议端点 + 3 个核心能力）

---

## Step 3 — `browser-bridge.md` §5 连接流程

**目标**：把"Popup 触发 bb-client"时序改为"ChatButton → SW sidePanel.open → Side Panel mount → useChatSession → SESSION_READY → SW 注入 bb-client"新流程。

**改动范围**：
- §5.1 正常流程 mermaid 时序图
- §5.2 关键时序点表格
- §5.3 关闭流程：用词调整（移除 Shadow DOM 控制面板相关参与者）

**保守原则**：
- §5.4 之后内容不动
- §6 Session 生命周期除一行修正（§6.2 入口改为 `POST /api/agent/new`）外不动

**前置条件**：Step 2 完成

**验收清单**：
- [x] §5.1 时序图不再有"Popup → CS bb.start"路径，改为 ChatButton → SW → Side Panel → SRV → page MAIN
- [x] §5.1 包含 SW `sidePanel.open` + Side Panel mount + `useChatSession` POST /api/agent/new + `SESSION_READY` + SW `executeScript({ world: 'MAIN' })` 加载 + 实例化
- [x] §5.2 6 行关键时序点全部更新（T1-T5 重写 + 新增 T6 业务循环）
- [x] §5.3 参与者从 Shadow DOM / Popup / CS 改为 Side Panel / SW / page MAIN(BBClient WS) / SRV；3 个 alt 路径重写（A=tab 关闭 / B=闲置超时 / C=用户主动结束）+ 新增 note 说明 bb-client WS 与 Side Panel 生命周期解耦

**实际改动摘要**：
- 新增段落：无新增大段；§5.2 表格新增 1 行（T6 业务循环）
- 删除段落：§5.1 旧 3 阶段时序图（含 POPUP→CS type:"bb.start"、Create Shadow DOM 渲染 agent-ui-chat、SD→SRV POST /api/sessions/{id}/prompt 等过时步骤）共 ~40 行；§5.3 旧 3 路径（含用户主动结束通过 Popup→CS type:"bb.stop"）共 ~12 行
- 修改段落：§5.1 时序图整张重画为 3 阶段新流程（会话启动 / bb-client 注入 MAIN / 业务循环）；§5.2 表格 5 行全改 + 加 1 行；§5.3 参与者重命名 + 路径重写 + 加 WS 解耦 note

---

## Step 4 — `browser-bridge.md` §7 + §12 + §14

**目标**：删除 ChatLauncher 时代"Shadow DOM 控制面板 UI 设计"章节；替换为 Session 持久化 + Associated Web Tab；修正 §12 文件结构指向真实代码路径；§14 加 v3.0.0 行。

**改动范围**：
- §7 整体重写：拆为 "ChatButton（page Shadow DOM）" + "Session 持久化（chrome.storage.session, key=tabId）" + "Associated Web Tab（Side Panel 自身 tabId 坑）"
- §12 文件结构：实际 entrypoints/ 路径（`chat-button.content/`、`sidepanel/`、`background.ts` SW 编排）
- §14 版本历史：加 v3.0.0 一行（2026-07-06，反映 ChatButton + Side Panel 拆分）

**保守原则**：
- §8 配置参数 / §9 消息路由 / §10 错误处理 / §11 不在设计范围内 / §13 监控与可观测性 严格不动
- §6 Session 生命周期大节不动（除 §6.2 入口行在 Step 3 已处理）

**前置条件**：Step 3 完成

**验收清单**：
- [x] §7 不再含"控制面板 UI / 调试入口 / 用户控制按钮"旧内容；整章重写为"chat session 与 tab 生命周期"（1 段 pointer + 3 行约束表）
- [x] §7 含 Session 持久化（chrome.storage.session, key=String(tabId)）+ Associated Web Tab 跟踪（Side Panel 自身 tabId 必须排除）+ tab 关闭清理
- [x] §12 文件结构指向 `entrypoints/background.ts` + `entrypoints/chat-button.content/index.tsx` + `entrypoints/sidepanel/{main.tsx, index.html}` + `public/bb-client.iife.js`，不再有旧 `extension/src/bb/{client,panel,reconnect,snapshot-bridge}.ts`
- [x] §14 加 3.0.0 行（2026-07-06，反映 ChatButton + Side Panel 拆分 + bb-client SW 注入 + chat session 持久化）

**实际改动摘要**：
- 新增段落：§7 简化为 1 段（"chat session 与 tab 生命周期" + pointer 到 §5 / agent-chat-integration.md）；§12 新增 agent-ui-chat/ 整块（`ChatButton.tsx` / `ChatWindow.tsx` / `useChatSession.ts`）和 extension/ 新真实 entrypoints 路径 + public/bb-client.iife.js
- 删除段落：§7 整章"Shadow DOM 控制面板设计"（65 行：§7.1 挂载位置 / §7.2 ~35 行 HTML 代码块 / §7.3 样式隔离 / §7.4 调试入口 / §7.5 用户控制）—— 控制面板已不存在；§12 旧 `extension/entrypoints/content.ts` + `extension/src/bb/{client,panel,reconnect,snapshot-bridge}.ts` 4 行
- 修改段落：§12 文件结构整段重排（agent-server/ + agent-ui-chat/ + browser-tool/ + extension/ 4 块并列，反映实际 entrypoints/ 真实路径）

---

## Step 5 — `browser-bridge-protocol.md` §11 时序图 + §14 版本历史

**目标**：bb-protocol 协议层字段不动，只重画时序图让接手人能复制新流程。

**改动范围**：
- §11.1 正常流程 mermaid 时序图：聚焦协议 3 方（CS / Router / RPC），去掉端到端 UI 元素（Popup / Shadow DOM / Page 不进协议文档）
- §11.2 停止流程：参与者 5→4（去掉 Panel Shadow DOM 控制面板）
- §15 版本历史加 v3.0.0 一行

**保守原则**：
- §1 - §10（协议概念、消息类型、字段、握手）一字不动
- §13 协议默认值、错误码不动
- CONNECT/CONNECTED/PAGE_SNAPSHOT 等消息类型不变（业务消息协议层 2.0）
- §14 "与其他文档的关系"里"Shadow DOM 设计"措辞按"严格不动"约定**不**碰（不在 §11 / §15 范围）

**前置条件**：Step 4 完成

**验收清单**：
- [x] §11.1 时序图聚焦协议 3 方（CS / Router / RPC），不再涉及 Popup / Shadow DOM / Page 等端到端 UI
- [x] §11.1 含 4 阶段：握手 / 业务消息循环 / 页面事件推送 / 心跳保活
- [x] §11.2 参与者从 5 个改 4 个（去掉 Panel Shadow DOM 控制面板）；保留 CS / Router / RPC / LLM 协议核心
- [x] §15 加 v3.0.0 行（2026-07-06，反映 ChatButton + Side Panel 拆分 + bb-client SW 注入 + §11 时序图聚焦协议 3 方）

**实际改动摘要**：
- 新增段落：§15 加 v3.0.0 行（反映文档版本演进 + 一次 ChatButton 拆分的内容）；§11.1 新 mermaid 描述握手（CONNECT/CONNECTED）+ 心跳保活（按 heartbeatInterval 频率）阶段
- 删除段落：§11.1 旧 6 参与者 5 阶段时序图（含 Popup→CS type:"bb.start"、CS 创建 Shadow DOM 渲染 agent-ui-chat、Router→SD SSE 事件流、4 条 `@agegr/browser-tool.snapshot/type(...)` 详细调用）；§11.2 旧"Panel (Shadow DOM 控制面板)"参与者 + 7 步
- 修改段落：§11.1 整张时序图重画（去掉端到端 UI 元素，聚焦协议三方）；§11.2 简化（5 参与者 → 4 参与者，移除 UI 触发步骤）

---

## 最终验证

- [ ] `grep -rn "ChatLauncher" docs/technical/agent-steer/` 命中数为 0（若设计上是 ChatLauncher 已废弃的引用则保留 @deprecated 上下文）
- [ ] `grep -rn "Popup → CS bb.start\|type:\"bb.start\"" docs/technical/agent-steer/` 命中数为 0
- [ ] `grep -rn "chat-content\.content" docs/technical/agent-steer/` 命中数为 0
- [ ] `grep -rn "Agent 控制面板 + 聊天 UI\|控制面板 UI" docs/technical/agent-steer/` 命中数为 0

---

## 改动日志

> 每完成一步，简要记一行

- 2026-07-06：创建追踪文件，5 步计划 + 验收清单就位
- 2026-07-06：Step 1 完成 — `agent-chat-integration.md` 用户手动精简（394 行 → 276 行，删除 §9 任务拆分 / §10 已有工作 / §11 验收），version 2.0.0 → 3.0.0
- 2026-07-06：Step 2 完成 — `browser-bridge.md` 改 §1.2 目标 + §2 核心约束 + §2.1 关系图 + §3.1 bb-client + §3.2 整节精简为 pointer
- 2026-07-06：Step 3 完成 — `browser-bridge.md` 改 §5.1 正常时序 mermaid + §5.2 关键时序点（5→6 行）+ §5.3 关闭流程
- 2026-07-06：Step 4 完成 — `browser-bridge.md` §7 整章重写（65 行→15 行）+ §12 文件结构整段重排 + §14 加 v3.0.0 行
- 2026-07-06：Step 5 完成 — `browser-bridge-protocol.md` §11.1 时序图整张重画（6→3 参与者）+ §11.2 停止流程简化（5→4 参与者）+ §15 加 v3.0.0 行
- 2026-07-06：类 A 残留清理 — `browser-bridge-protocol.md` 协议字段描述里 3 处"控制面板"措辞改"Side Panel UI"（L85 `STOP` 消息 / L154 `user_stop` reason / L603 §6 错误码说明），grep 全清
