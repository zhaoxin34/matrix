---
id: interceptor
title: Intercept 拦截器技术设计
sidebar_position: 21
author: Joky.Zhao
created: 2026-06-25
updated: 2026-06-25
version: 1.0.0
tags: [Agent, Steer, Browser Tool, Intercept, Chrome Extension]
---

# Intercept 拦截器技术设计

> **browser-tool 的能力扩展** —— 与 `click` / `fill` / `type` 同级的原子操作,只是语义更重(持续监听 + 自动决策)。

---

## 1. 背景

[browser-tool.md](./browser-tool.md) 定义了 `click` / `fill` / `type` / `press` / `hover` / `drag` / `select` / `scroll` 等原子操作。这些操作都是"调用方发一次指令,CS 立即在目标元素上执行一次动作"。

但**业务事件采集**和**敏感操作二次确认**需要的能力是反过来的:

- 不是"我去点这个按钮",而是"**这个按钮被点时**通知我(或阻止)"
- 不是"立刻发生",而是"**持续监听**直到我取消"
- 不是"无脑执行",而是"按 before / after 流程编排动作"

这就是 `intercept` 这个原子操作 —— **抽象层级跟 `click` 完全一致,只是从"主动执行"变成"被动监听 + 决策编排"**。

把它独立成"模块"会引入不必要的心智负担;放进 `browser-tool` 是更合理的位置。

---

## 2. 目标

1. **API 形态对齐 `click` / `fill`**: `intercept(target, options)` 是底层原子操作,上层"规则引擎"是业务概念,不在 API 层体现
2. **支持 DOM 元素 + 网络请求两种 target**: 统一抽象,不同实现
3. **模式支持按 target 区分**:
   - **DOM 拦截**:`observe` / `intercept` 两种模式(`observe` 默认)
   - **网络拦截**:**仅支持 `observe` 模式**,intercept 模式永久不做(见 §6.4)
4. **before / after Action 编排**: 跟 product 文档定义的 Event/Status 采集流程对齐
5. **可取消**: 返回 `InterceptHandle`,调用方随时 `cancel()` 停止监听

---

## 3. 抽象签名

```ts
// 与 click(target) / fill(target, value) / type(target, text) 同级

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
| `type(target, text)` | `action(target, text)` | 立即一次 | 是(主动执行) |
| `intercept(target, opts)` | `action(target, options)` | 持续监听 | DOM: observe 否 / intercept 是 / **网络: 否(永久)** |

**为什么签名相似,实现重得多**:

- `click` 是"一次性同步操作",CS 内部直接 `target.click()` 就完事
- `intercept` 是"持续监听 + 异步决策",内部涉及:
  - DOM 模式: `document.addEventListener` + 命中判定 + 模式分支
  - 网络模式: Page World hook 注入 + 跨世界 postMessage + 异步决策
- 但**这些重逻辑是实现细节,API 层不必暴露**

---

## 4. API 设计

### 4.1 Options

```ts
interface InterceptOptions {
  /** 事件名,after 动作里生成 Event 时使用 */
  eventName: string;

  /** 拦截模式,默认 'observe' */
  mode?: 'observe' | 'intercept';

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

## 5. 内部架构

### 5.1 DOM 拦截(Content Script 内自洽)

跟 `click` 实现思路一致,**只是把"主动执行"换成"被动监听"**:

```ts
// 简化版,展示核心逻辑
async function interceptDom(target: DomTarget, opts: InterceptOptions): Promise<InterceptHandle> {
  const el = resolveTarget(target);
  let triggered = 0;
  let debounceTimer: number | null = null;

  const handler = async (e: Event) => {
    if (debounceTimer) return;                    // 防重入
    if (opts.pageUrlPattern && !new RegExp(opts.pageUrlPattern).test(location.href)) return;

    if (opts.mode === 'intercept') {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      await runActions(opts.beforeActions ?? [], { e, target: el });
      if (opts.mode === 'intercept') {
        // 编程式重放,保留 isTrusted: true
        await replayer.click(el);
      }
      triggered++;
    } catch (err) {
      handle.lastResult = { beforeOk: false, afterOk: false, error: String(err) };
      return;
    }

    // after 动作异步执行,不阻塞主流程
    runActions(opts.afterActions ?? [], { e, target: el })
      .then(() => { handle.lastResult = { beforeOk: true, afterOk: true }; })
      .catch(err => { handle.lastResult = { beforeOk: true, afterOk: false, error: String(err) }; });

    debounceTimer = setTimeout(() => { debounceTimer = null; }, opts.debounceMs ?? 1000);
  };

  document.addEventListener('click', handler, { capture: true, passive: false });

  const handle: InterceptHandle = {
    cancel: () => document.removeEventListener('click', handler, { capture: true } as any),
    get triggered() { return triggered; },
  };
  return handle;
}
```

**关键点**:

- 事件委托挂在 `document` 上,XPath/CSS selector 都不需要重绑,SPA 路由自动适配
- `observe` 模式:`e.preventDefault()` 不调用,原 click 正常走
- `intercept` 模式:`preventDefault` + `stopPropagation`,before 完成后用 `browser-tool.click()` 编程式重放(保留 `isTrusted: true`)
- 防重入:同一元素 1s 内的重复 click 第二次起忽略

### 5.2 网络拦截(需 Page World 注入)

**为什么不能直接在 Content Script 实现**:

Content Script 跑在 isolated world,重写 `window.fetch` / `XMLHttpRequest` **对页面代码无效** —— 页面访问的是 page world 的原始 fetch,扩展重写的是孤立的引用。这是浏览器扩展拦截网络最容易踩的坑。

**正确做法**: 用 `chrome.scripting.executeScript({ world: 'MAIN' })` 把 hook 脚本注入到 page world。

```
┌─────────────────────────────────────────────────────────────┐
│ Isolated World (Content Script)                              │
│   - browser-tool.intercept({type:'network', ...})           │
│   - 监听 window.message                                      │
│   - 匹配规则,执行 before/after actions                      │
└────────────────────────────────────┬────────────────────────┘
                                     │ window.postMessage
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Main World (Page JS)                                         │
│   - hook.js 替换 window.fetch / XHR                         │
│   - 每次请求 fire-and-forget postMessage                     │
│   - 拦截决策(仅 intercept 模式需要): 等 CS 决策再放行         │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Page World Hook 脚本

作为独立 chunk 通过 WXT `defineUnlistedScript` 注入,`document_start` 阶段执行:

```ts
// src/entrypoints/injected/network-hook.ts (独立构建,注入到 MAIN world)
export default defineUnlistedScript(() => {
  const POSTMSG_TAG = '__neo_intercept__';

  // 替换 fetch
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const req = normalizeFetch(input, init);

    // observe 模式:fire-and-forget postMessage
    window.postMessage({
      tag: POSTMSG_TAG,
      phase: 'before',
      kind: 'fetch',
      method: req.method,
      url: req.url,
      body: req.body,
    }, '*');

    // 继续走原 fetch
    return originalFetch.call(this, input, init);
  };

  // 替换 XHR
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__intercept__ = { method, url };
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (this.__intercept__) {
      window.postMessage({
        tag: POSTMSG_TAG,
        phase: 'before',
        kind: 'xhr',
        method: this.__intercept__.method,
        url: this.__intercept__.url,
        body,
      }, '*');
    }
    return originalSend.call(this, body);
  };
});
```

**关于 intercept 模式的 async 决策**:

observe 模式 fire-and-forget 即可(默认行为,零风险);intercept 模式需要 hook 脚本**同步等待** CS 决策 —— 这会把异步传染到所有 fetch,性能开销大,默认不开。详见 §6 设计决策 4。

### 5.4 跨世界通信协议

```ts
// Page World → Content Script
type FromPage =
  | { tag: '__neo_intercept__', phase: 'before', kind: 'fetch'|'xhr', method: string, url: string, body: any, requestId: string }
  | { tag: '__neo_intercept__', phase: 'after', kind: 'fetch'|'xhr', requestId: string, status: number, body: any };

// Content Script → Page World (仅 intercept 模式)
type FromCS =
  | { tag: '__neo_intercept_resp__', requestId: string, decision: 'allow' | 'deny' | 'rewrite', rewrite?: any };
```

**关键约定**:

- `tag` 字段是 namespace,Content Script 端 `addEventListener('message')` 过滤
- `requestId` 用于把"before"和"after"配对,UUID v4
- Content Script 端只读 page world 的 postMessage,**不要回写**敏感信息(防止 page world 恶意代码伪造)

---

## 6. 设计决策

### 6.1 为什么是 API 而不是独立模块

`intercept(target, options)` 抽象签名跟 `click(target)` / `fill(target, value)` 完全一致 —— 都是"对某个 target 做一个动作"。把 intercept 提到"模块"层级会:

- 引入新的心智模型("我到底是用 intercept 模块还是 browser-tool?")
- 破坏 Target 格式的统一性(DOM/CSS/Element/lazy function)
- 重复实现元素查找、等待、滚动等 browser-tool 已有的能力

正确分层是:**browser-tool 提供原子 API,agent-steer 业务模块用这些 API 组合出"规则引擎"功能**。

### 6.2 observe 默认 + intercept 显式

**默认 observe**(fire-and-forget)的考虑:

- 多数业务事件采集场景是知识沉淀,不需要阻断原行为
- 阻断是高风险操作 —— 一个 bug 就可能让用户点不动按钮
- observe 性能开销可忽略(network hook 本身就是 fire-and-forget)

**intercept 显式**:

- 异步决策会引入 latency(默认 5s 超时)
- 改写 response 是巨大复杂度(涉及 streaming、binary body、错误处理)
- 显式声明让用户/审计明确知道"这次会改变原行为"

### 6.3 网络拦截为什么必须 page world 注入

[Content Script 跑在 isolated world,重写 fetch 对 page world 不可见] —— 这是浏览器扩展的标准安全模型,没有绕过方式。`chrome.scripting.executeScript({ world: 'MAIN' })` 是唯一标准做法。

### 6.4 网络拦截: 仅 observe 模式,intercept 永久不做

**这是产品决策,不是技术限制**。即使将来有需求,网络拦截也不应在本模块支持 `intercept` 模式。

**三条理由**:

1. **零风险原则**: `observe` 模式是 fire-and-forget —— Page World hook 脚本 `postMessage` 发出就返回,从不等待 CS 决策。这意味着 hook 对原请求**零延迟、零阻塞、零失败传染**。一旦切到 `intercept` 模式,所有匹配的 fetch 都要变成 async,latency 引入到主链路,任何 CS 端的 bug 都会让目标软件卡住。
2. **业务场景不需要**: 网络拦截的主要用例是**业务事件采集**(用请求当信号源生成 Event),观察型完全够用。真正需要"阻断/改写"的场景(API Mock、风险拦截)跟 agent-steer 的知识沉淀目标不一致,属于另一类工具(如 Charles、Postman Interceptor)的能力,不在本模块定位内。
3. **复杂度爆炸**: `intercept` 模式要求 hook 脚本同步等待 CS 决策,然后**改写 response body**——这要处理 streaming、binary、错误、超时,以及"放行但改写"的边界。复杂度直接上一个量级,投入产出比不划算。

**调用方约束**: API 层不应该接受 `mode: 'intercept'` + `NetworkTarget` 的组合。如果传了,直接抛错,避免误用。

### 6.5 异步决策的超时

DOM intercept 模式下,如果 `show_confirm` / `call_agent` 一直不响应,必须超时放行,避免页面卡死。**默认超时 5s**,放行原行为并写一条 warn 日志。

### 6.6 Action 编排的执行语义

```
before 动作: 顺序执行(可用 await 串起来),任一失败则中断
原行为触发: observe 不阻断 / intercept 编程式重放
after 动作:  fire-and-forget 异步执行,不阻塞 handle
```

设计取舍:before 必须同步成功(否则原行为没有依据);after 是"事后补全",失败也无所谓。

---

## 7. 限制

| 限制 | 说明 |
|------|------|
| ❌ 跨域 iframe | 浏览器安全边界,Content Script 注入受限(跟现有 browser-tool 一致) |
| ❌ network intercept 模式 | **永久不做**,网络拦截仅 observe 模式,见 §6.4 |
| ❌ response body 改写 | 同上,observe 模式只读,不改写 |
| ❌ 改写 request body | 同上,observe 模式只读,不改写 |
| ⚠️ Shadow DOM 边界 | closed shadow root 不可访问,open shadow root 可访问 |
| ⚠️ Performance | 网络 hook 注入后所有 fetch/XHR 都过一遍 message 通道,毫秒级开销 |
| ⚠️ 重复绑定 | 同 target 多次 `intercept` 不会去重,各自触发,调用方自己管理 |
| ⚠️ 防重入窗口 | 默认 1s,防止快速连点;如需更短/更长,显式传 `debounceMs` |

---

## 8. 跟 agent-steer 业务模块的集成

**重申**:`intercept` 是**底层 API**。agent-steer 的"规则引擎"是上层业务概念,使用方式:

```ts
// agent-steer 的"规则引擎"伪代码
async function bootstrapInterceptor() {
  const rules = await api.getInterceptorRules(workspaceCode);

  for (const rule of rules) {
    if (rule.trigger.type === 'dom.click') {
      await intercept(rule.trigger.xpath, {
        eventName: rule.eventName,
        mode: rule.mode,
        beforeActions: rule.beforeActions,
        afterActions: rule.afterActions,
        pageUrlPattern: rule.pageUrlPattern,
      });
    } else if (rule.trigger.type === 'network.fetch') {
      await intercept({
        urlPattern: rule.trigger.urlPattern,
        method: rule.trigger.method,
      }, {
        eventName: rule.eventName,
        mode: 'observe',   // 网络模式一律 observe
        afterActions: rule.afterActions,
      });
    }
  }
}
```

**产品层概念 vs API 层概念的对应**:

| 产品层(Neo 前端配置) | API 层(browser-tool) | 说明 |
|---------------------|---------------------|------|
| 规则 (Rule) | 一次 `intercept()` 调用 | 一条规则 = 一个 handle |
| trigger 字段 | target 参数 | DOM 走 xpath,网络走 urlPattern |
| eventName | InterceptOptions.eventName | 透传到 Action |
| before / after actions | InterceptOptions.beforeActions / afterActions | 透传 |
| mode: observe / intercept | InterceptOptions.mode | 透传 |
| 规则集合 | 循环调用 `intercept()` 多次 | 由 agent-steer 业务模块管 |

---

## 9. 与 Recording 的关系

| 维度 | Recording | Intercept |
|------|----------|-----------|
| 数据形态 | rrweb 原始事件流(全量 DOM 快照 + 鼠标轨迹) | 结构化 Event + Status(after 采集) |
| 体积 | 大(MB 级) | 小(KB 级) |
| 业务语义 | 没有(只是"页面发生了什么") | 有(由用户配置的 eventName 决定) |
| 用途 | 回放 / 调试 / 培训 | 知识图谱 / 推理 / Agent 训练 |

**互补关系**:Recording 是"屏幕录像机",Intercept 是"事件语义提取器"。两者可以叠加 —— 录制时同步开启 intercept,后期回放时既有原始画面又有结构化 Event 标注。

---

## 10. 实施步骤

### Phase 1 (MVP, 1 周): DOM observe 模式

- `intercept(target, options)` DOM 模式
- Action: `collect_event`, `collect_status`
- 单元测试 + 集成测试
- 文档示例

### Phase 2 (1 周): DOM intercept 模式 + show_confirm

- `show_confirm` Action + Shadow DOM 确认卡
- 异步决策 + 5s 超时
- 编程式重放(保留 isTrusted)

### Phase 3 (1 周): 网络 observe 模式

- Page World hook 脚本(`defineUnlistedScript`)
- 跨世界 postMessage 协议
- URL pattern 匹配
- 实体提取(URL 模板 + JSONPath)

### Phase 4 (可选): Agent 集成

- `call_agent` Action
- 跟 browser-bridge protocol 衔接
- agent 决策超时处理

---

## 11. 相关文档

- [browser-tool 技术设计](./browser-tool) - 现有原子操作 API 列表、Target 格式
- [Browser Bridge 详细设计](./browser-bridge) - 与 agent-server 的通信协议
- [Agent Steer 技术设计](./index) - agent-steer 系统架构
- [Agent Steer 产品设计](../../product/agent-steer) - Event / Status / Interception 三元组定义
- [neo-agents 工程架构](./neo-agents) - agent-server 集成方式
