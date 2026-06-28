---
id: interceptor
title: Intercept 拦截器技术设计
sidebar_position: 25
author: Joky.Zhao
created: 2026-06-25
updated: 2026-06-28
version: 2.1.0
tags: [Agent, Steer, Intercept, Chrome Extension, Extension]
---

# Intercept 拦截器技术设计

> interceptor 是 **extension 项目的功能**。在 extension/content.ts 内实现完整 lifecycle(DOM 拦截 + 网络拦截 + 全量重置),跟外部数据源 / Action Player 通信。
>
> 底层 DOM 编程式重放(用于 intercept 模式)用 [browser-tool](./browser-tool) 的 `click()` / `fill()`。

---

## 1. 背景

业务事件采集 / 敏感操作二次确认需要的能力:

- 不是"我去点这个按钮",而是"**这个按钮被点时**通知我(或阻止)"
- 不是"立刻发生",而是"**持续监听**直到我取消"
- 不是"无脑执行",而是"按 before / after 流程编排动作"

**interceptor** = 在 extension/content.ts 内提供 `intercept(target, options)` API,支持 DOM 元素和 HTTP 请求两种 target,observe / intercept 两种模式,before / after action 编排。

---

## 2. 目标

1. **`intercept(target, options)` 是底层原子操作**(与 `click(target)` 同级),上层"规则引擎"是业务概念,不在 API 层体现
2. **DOM + 网络两种 target 统一抽象**,内部不同实现
3. **模式按 target 区分**:
   - DOM 拦截:`observe` / `intercept` 两种模式
   - 网络拦截:**仅 `observe` 模式**,intercept 永久不做(见 §6)
4. **before / after Action 编排**,跟 product 文档定义的 Event/Status 采集流程对齐
5. **可取消**: 返回 `InterceptHandle`,调用方随时 `cancel()`

---

## 3. 抽象签名

```ts
// 模块路径: extension/src/interceptor/

// DOM 拦截
function intercept(
  target: DomTarget,
  options: InterceptOptions
): Promise<InterceptHandle>;

// 网络拦截
function intercept(
  target: NetworkTarget,
  options: InterceptOptions
): Promise<InterceptHandle>;
```

**API 风格对比**:

| 操作 | 抽象签名 | 触发时机 | 阻塞原行为 |
|------|---------|---------|----------|
| `click(target)` | `action(target)` | 立即一次 | 是(主动执行) |
| `fill(target, value)` | `action(target, value)` | 立即一次 | 是(主动执行) |
| `intercept(target, opts)` | `action(target, options)` | 持续监听 | DOM: observe 否 / intercept 是 / **网络: 否(永久)** |

---

## 4. API 设计

### 4.1 Options

```ts
interface InterceptOptions {
  /** 事件名,after 动作里生成 Event 时使用 */
  eventName: string;

  /** 拦截模式,默认 'observe' */
  mode?: 'observe' | 'intercept';

  /** 被拦截/操作的实体名(主语)。必填,后续 collect_event / collect_status 直接用作 Event.entity_name / Status.entity_name,不再动态抽取 */
  entityName: string;

  /** 操作的目标实体名(宾语)。选填,只有"操作另一个实体"的场景需要(如"把线索分配给张三") */
  targetEntityName?: string;

  /** before 动作:target 触发前执行 */
  beforeActions?: Action[];

  /** after 动作:target 触发后执行 */
  afterActions?: Action[];

  /** 页面 URL 正则,限定生效范围(DOM 模式) */
  pageUrlPattern?: string;

  /** 触发后,是否锁定一段时间防重入(ms),默认 1000 */
  debounceMs?: number;
}
```

> **entityName / targetEntityName 是静态字符串**(不动态抽取)。如果将来要支持动态(如"每次点不同 lead,lead_id 从 URL 提取"),再加模板变量机制——见 §8.4 未决问题。

### 4.2 Action 类型(与 product 文档对齐)

```ts
type Action =
  | { type: 'collect_event', config: { actor: string, metadata?: Record<string, any> } }
  | { type: 'collect_status', config: { entityName: string, attributes: Record<string, string> } }
  | { type: 'call_agent', config: { endpoint: string, timeoutMs?: number } }
  | { type: 'show_confirm', config: { title: string, body: string, confirmLabel?: string, cancelLabel?: string } }
  | { type: 'show_toast', config: { message: string, level?: 'info'|'warn'|'error' } };
```

`attributes: Record<string, string>` 的 value 是 XPath 表达式(从 DOM 提取状态字段),后端 schema 跟 product 文档一致。

### 4.3 Target 格式

```ts
// DOM Target 沿用 browser-tool 现有格式
type DomTarget = string | Element | (() => Element | null);
//  - string: CSS selector / id (e1/e2...)
//  - Element: 直接传元素
//  - function: lazy 解析(适合动态元素)

// Network Target
type NetworkTarget =
  | string                            // 简写: URL pattern
  | { urlPattern: string, method?: 'GET'|'POST'|'PUT'|'DELETE'|'PATCH' };
```

### 4.4 返回值

```ts
interface InterceptHandle {
  /** 取消监听 */
  cancel(): void;

  /** 已触发次数(observe: 实际触发;intercept: 放行次数) */
  readonly triggered: number;

  /** 最后一次触发的 before/after 执行结果 */
  readonly lastResult?: {
    beforeOk: boolean;
    afterOk: boolean;
    error?: string;
  };
}
```

---

## 8. 管理过程

interceptor 跟其他 workspace 数据对象(embedded-sites / events / status)一样,需要**定义 → 加载 → 埋点**三个阶段。

### 8.1 三阶段职责

| 阶段 | 做什么 | 在哪做 | 谁触发 |
|------|--------|--------|--------|
| **定义** | 在 Neo 前端 workspace 下的 `interceptors` 菜单配置规则 | Neo 前端 + 后端 API | **管理员** |
| **加载** | 业务人员浏览器里,extension/content.ts 拉取当前页面匹配的 interceptors | extension/content.ts | **业务人员** 打开目标软件页面 |
| **埋点** | 调 `intercept()` 注册监听 | extension/content.ts + extension/entrypoints/hook.ts(网络模式) | 加载阶段自动衔接 |

### 8.2 数据流(时序图)

```mermaid
sequenceDiagram
    autonumber
    actor A as 管理员
    actor B as 业务人员
    participant FE as Neo 前端
    participant BE as Backend
    participant EXT as extension/content.ts<br/>(业务人员浏览器里)
    participant BG as extension/background.ts
    participant HK as extension/entrypoints/hook.ts<br/>(Main World)
    participant Page as 目标软件页面
    participant AP as Action Player<br/>(agent-server)

    rect rgb(100, 108, 155)
    Note over A,BE: 阶段 1: 定义(管理员在 Neo 前端配置)
    A->>FE: 在 workspace/interceptors 下配置规则
    FE->>BE: POST /api/v1/workspaces/{workspace_code}/interceptors
    BE-->>FE: 201 Created
    end

    rect rgb(105, 108, 140)
    Note over B,EXT: 阶段 2: 加载(业务人员打开目标软件时触发)
    Note over EXT: workspace_code 由 extension 配置或 popup 获取
    B->>Page: 打开目标软件
    Page->>EXT: 页面加载,extension 注入
    EXT->>BE: GET /api/v1/workspaces/{workspace_code}/embedded-sites?enabled=true
    BE-->>EXT: {code:0, data:{items:[{site_id, url_pattern, ...}]}}
    EXT->>EXT: 本地正则匹配当前 URL → 找到 site
    alt 找到 site
        EXT->>BE: GET /api/v1/workspaces/{workspace_code}/interceptors?site_id=X&enabled=true
        BE-->>EXT: {code:0, data:{items:[rule1, rule2, ...]}}
    else 未匹配到 site
        Note over EXT: 跳过,清空所有 handle
    end
    Note over BG,HK: 网络拦截需要时:background 注入 hook 到 Main World
    BG->>HK: chrome.scripting.executeScript({world:'MAIN'})
    HK->>Page: hook 替换 fetch / XHR
    end

    rect rgb(100, 105, 140)
    Note over EXT,AP: 阶段 3: 埋点(全量重置,持续监听)
    loop 取消所有旧 handle
        EXT->>EXT: handle.cancel()
    end
    loop 每条新 rule
        alt DOM 拦截
            EXT->>EXT: intercept(domTarget, options)
        else 网络拦截
            EXT->>HK: 已经在 Page World hook,规则匹配在 EXT 端
        end
    end

    Note over B,AP: 阶段 4: 拦截触发(伪调用)
    B->>Page: 操作目标元素 / 触发 fetch
    Page->>HK: (网络) hook 触发 postMessage
    HK->>EXT: window.message {tag, phase:'before', ...}
    EXT->>EXT: 匹配 rule,执行 before actions
    EXT->>AP: POST /api/v1/action-player/execute<br/>(默认 mock executor)
    AP-->>EXT: { uiInstruction?, results }
    alt 有 uiInstruction
        EXT->>EXT: Shadow DOM 弹窗 + 等用户
        EXT->>AP: POST /continue {sessionId, executionId, decision}
        AP-->>EXT: { finalResults }
    end
    end
```

### 8.3 关键设计决策(本节定调)

| 决策 | 结论 | 理由 |
|------|------|------|
| **数据模型** | `Interceptor = Rule`(平铺) | 单表,心智简单 |
| **归属** | Interceptor 挂在 Site 下(`site_id` 外键) | 隔离天然,加载逻辑清晰 |
| **URL → Site 匹配** | extension/content.ts 本地缓存 site 列表,本地正则 | site 列表变化频率低,避免每次都查后端 |
| **加载策略** | **全量重置** | 每次拉取都 `cancel()` 所有旧 handle + 重新 `intercept()`。实现简单,保证"前端状态 = 后端状态",不会出现"已禁用规则还在触发"或"重复监听" |
| **加载时机** | (1) Content Script 启动 (2) URL 变化 (3) 30s 定时刷新 | 覆盖"首次进入 / SPA 路由 / 后端规则更新" |
| **拦截器定义拉取源** | 环境变量决定:fixture / mock-server / real-backend | demo / 测试 / 生产可切换,不依赖固定后端 |
| **Action Player 调用** | 默认 mock executor,环境变量切真调 | demo / CI 不依赖后端;测试稳定 |
| **网络拦截模式** | **永久 observe,intercept 不做** | 网络拦截主要用例是业务事件采集,observe 已够用 |

### 8.4 未决问题(留待后续,本节不展开)

- Action 字段值的填法:静态字符串 / DOM XPath 提取 / URL 模板提取 —— 怎么统一表达
- Action 扩展机制:硬编码 / 注册表 / 插件化
- 启用/禁用 UI、测试工具、审计日志
- 动态 entityName:目前是静态字符串,如果业务上需要"每次拦截不同实体"(如"每次分配不同 lead"),需加模板变量或 context 抽取机制

---

## 9. 协议契约(extension ↔ 后端)

extension/content.ts 在 lifecycle 各阶段会与后端交换数据。本节给出**extension 视角**的接口契约,作为实现的依据。

> **⚠️ 说明**:以下 schema 是基于设计文档推断的草案,**最终以实际后端代码为准**。如果后端实现不一致,以 PR/CI 校验后的 schema 为准。

> **⚠️ workspace_code 说明**:extension 调用后端 API 时需要指定 workspace_code。该值通过以下方式获取:
>
> 1. extension 配置文件中的 `workspace_code` 字段
> 2. 或通过 Neo 平台 agent 获取当前 workspace context

### 9.1 GET /api/v1/workspaces/{workspace_code}/embedded-sites?enabled=true

**用途**:阶段 2 加载 —— 拉取当前 workspace 下所有启用的嵌入站点,用于本地正则匹配当前 URL。

**路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `workspace_code` | string | 是 | Workspace 标识符 |

**查询参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | 否 | 只返回 enabled 的站点;不传或 true 都返回全部 |

**响应** (符合 Neo API 规范 `{ code, message, data, traceId, timestamp }`):

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": "uuid",
        "site_code": "salesforce-crm",
        "site_name": "Salesforce CRM",
        "url_patterns": [
          "https://.*\\.salesforce\\.com/.*",
          "https://.*\\.force\\.com/.*"
        ],
        "status": "ENABLED"
      }
    ],
    "total": 1
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

**响应字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.items[].id` | uuid | 站点唯一标识,后续查 interceptors 用 |
| `data.items[].site_code` | string | 站点业务码(人类可读) |
| `data.items[].site_name` | string | 站点显示名称 |
| `data.items[].url_patterns` | string[] | 正则表达式列表,任一匹配 current URL 即认为该 site 生效 |
| `data.items[].status` | string | 站点状态(ENABLED/DISABLED) |

### 9.2 GET /api/v1/workspaces/{workspace_code}/interceptors?site_id=X&enabled=true

**用途**:阶段 2 加载 —— 拉取指定 workspace 和 site 下的所有启用拦截器规则。

**路径参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `workspace_code` | string | 是 | Workspace 标识符 |

**查询参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `site_id` | uuid | **是** | 从 `embedded-sites` 列表中匹配到的 site.id |
| `enabled` | boolean | 否 | 只返回 enabled 的拦截器 |

**响应** (符合 Neo API 规范 `{ code, message, data, traceId, timestamp }`):

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "lead-assign-confirm",
        "embedded_site_id": "uuid",
        "status": "ENABLED",
        "rules": [
          {
            "id": "rule-uuid",
            "target_type": "dom",
            "target_selector": "#assign-btn",
            "event_name": "lead.assigned",
            "entity_name": "lead",
            "target_entity_name": "user",
            "mode": "intercept",
            "page_url_pattern": "https://.*/lead/.*",
            "debounce_ms": 1000,
            "before_actions": [...],
            "after_actions": [...]
          },
          {
            "id": "rule-uuid-2",
            "target_type": "network",
            "url_pattern": "/api/leads/.*/assign",
            "method": "POST",
            "event_name": "lead.assigned",
            "entity_name": "lead",
            "mode": "observe",
            "debounce_ms": 1000,
            "before_actions": [...],
            "after_actions": [...]
          }
        ]
      }
    ],
    "total": 1
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

**响应字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `data.items[].id` | uuid | 拦截器唯一标识 |
| `data.items[].name` | string | 拦截器名称 |
| `data.items[].embedded_site_id` | uuid | 关联的站点 ID |
| `data.items[].status` | string | 状态(ENABLED/DISABLED) |
| `data.items[].rules` | Rule[] | 规则列表 |
| `data.items[].rules[].id` | uuid | 规则唯一标识(用于 cancel 时匹配) |
| `data.items[].rules[].target_type` | `'dom' \| 'network'` | 目标类型 |
| `data.items[].rules[].target_selector` | string | DOM: CSS 选择器或 e1/e2 id |
| `data.items[].rules[].url_pattern` | string | 网络: URL 正则 |
| `data.items[].rules[].method` | string | 网络: HTTP 方法过滤(`GET`/`POST`/...) |
| `data.items[].rules[].event_name` | string | 事件名 |
| `data.items[].rules[].entity_name` | string | 主语实体 |
| `data.items[].rules[].target_entity_name` | string | 宾语实体 |
| `data.items[].rules[].mode` | `'observe' \| 'intercept'` | 默认 `observe` |
| `data.items[].rules[].page_url_pattern` | string | 限定生效页面 URL 正则 |
| `data.items[].rules[].debounce_ms` | number | 默认 1000 |
| `data.items[].rules[].before_actions` | Action[] | 触发前动作 |
| `data.items[].rules[].after_actions` | Action[] | 触发后动作 |

### 9.3 POST /api/v1/action-player/execute

**用途**:阶段 4 拦截触发 —— 把 action 列表交给 agent-server 的 Action Player 执行。

**请求**:

```json
{
  "session_id": "uuid",
  "execution_id": "uuid",
  "actions": [
    { "type": "collect_event", "config": { "actor": "user-uuid", "metadata": {} } },
    { "type": "show_confirm", "config": { "title": "确认分配?", "body": "..." } }
  ],
  "context": {
    "page_url": "https://...",
    "event_name": "lead.assigned",
    "entity_name": "lead",
    "target_entity_name": "user",
    "mode": "intercept",
    "actor": "user-uuid",
    "snapshot": "/* 简化 a11y tree */"
  }
}
```

**请求字段**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `session_id` | uuid | 是 | tab 维度,由 `POST /api/agent/new` 创建 |
| `execution_id` | uuid | 是 | 单次拦截标识,每次触发生成新 UUID,用于配对 `/continue` |
| `actions` | Action[] | 是 | 要执行的动作(同 §4.2 类型) |
| `context.page_url` | string | 是 | 当前页面 URL |
| `context.event_name` | string | 是 | 来自 interceptor rule |
| `context.entity_name` | string | 是 | 来自 interceptor rule |
| `context.target_entity_name` | string | 否 | 来自 interceptor rule |
| `context.mode` | string | 是 | `observe` / `intercept` |
| `context.actor` | string | 是 | 当前用户 id |
| `context.snapshot` | string | 否 | 目标元素 a11y snapshot(给 call_agent 用) |

**响应**:

```json
{
  "uiInstruction": {
    "type": "show_confirm",
    "title": "确认分配?",
    "body": "您正在把线索 #12345 分配给张三",
    "confirmLabel": "确认",
    "cancelLabel": "取消"
  },
  "results": [
    { "action_type": "collect_event", "ok": false, "error": "skipped before confirm" }
  ],
  "canceled": false
}
```

**响应字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `uiInstruction` | UiInstruction \| undefined | 如果有 `show_confirm` / `show_toast`,由 CS 用 Shadow DOM 渲染 |
| `results` | ActionResult[] | 已执行 action 的结果 |
| `canceled` | boolean | 是否被 `show_confirm` 取消 |

### 9.4 POST /api/v1/action-player/continue

**用途**:阶段 4 `show_confirm` 用户决策后回传。

**请求**:

```json
{
  "session_id": "uuid",
  "execution_id": "uuid",
  "decision": "confirm"
}
```

**请求字段**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `session_id` | uuid | 是 | 同 `/execute` |
| `execution_id` | uuid | 是 | 同 `/execute` |
| `decision` | `'confirm' \| 'cancel'` | 是 | 用户决策 |

**响应**:

```json
{
  "results": [
    { "action_type": "collect_event", "ok": true }
  ],
  "canceled": false
}
```

### 9.5 环境变量

extension/content.ts 通过环境变量决定拉取源和 Action Player 调用方式:

| 环境变量 | 取值 | 默认 | 说明 |
|----------|------|------|------|
| `INTERCEPTOR_SOURCE` | `fixture` / `mock-server` / `real-backend` | `fixture` | 拦截器定义拉取源 |
| `ACTION_PLAYER_MODE` | `mock` / `real` | `mock` | Action Player 调用模式 |
| `BACKEND_BASE_URL` | URL string | `http://localhost:30141` | real-backend / real 模式下的 base URL |
| `MOCK_SERVER_PORT` | number | `30150` | mock-server 模式下的本地 mock server 端口 |
| `FIXTURE_PATH` | path | `fixtures/interceptors.json` | fixture 模式下的本地 JSON 路径 |

> **demo / CI 默认全部 mock**,不依赖任何外部服务;通过环境变量切换到真实链路做端到端验证。

---

## 🔗 相关文档

- [browser-tool 技术设计](./browser-tool) - 底层 click/fill 重放(本设计用)
- [Action Player (AP) 技术设计](./action-player) - 后端 action 执行器,extension 通过 HTTP 调用(§9.3/§9.4 协议的完整来源)
- [Browser Bridge 详细设计](./browser-bridge) - BBP 协议设计
- [Agent Steer 技术设计](./index) - Chrome Extension 总览
- [embedded-site 产品文档](../../product/workspaces/embedded-site) - site 概念的产品定义(§9.1 协议的产品侧对应)
