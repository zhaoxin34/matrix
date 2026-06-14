# @neo/dom-snapshot

> 把任意 DOM 树压缩成 LLM 友好的扁平结构 (`id` / `role` / `name` / `visible` / `rect` …)，并提供 `click` / `fill` 双向操作能力。

受 [agent-browser](https://github.com/saikirandulla/agent-browser) 和 [browserclaw](https://github.com/idan-rubin/browserclaw) 的 snapshot 设计启发，做成可独立嵌入任何项目（React、Vue、原生、Bookmarklet…）的库。

> 📋 v0.2 设计灵感与对齐细节：见 [`docs/plan-v0.2-browserclaw-alignment.md`](docs/plan-v0.2-browserclaw-alignment.md)

## 适用场景

- 给 AI Agent 提供"页面可操作元素清单"
- 在 e2e/UI 自动化中稳定地引用 DOM（不依赖 CSS Selector、XPath）
- 调试时把复杂 DOM 压成"语义化"清单
- A11y 工具：直接拿到每个元素的 accessible name + 位置 + 状态

## 快速开始

```bash
make install      # 安装依赖
make dev          # 启动 demo 页面 (http://127.0.0.1:5100)
make test         # 跑单测
make build        # 构建 ESM + CJS + d.ts
```

## API

### `snapshot(root?, options?)`

扫描 DOM 树，返回 `SnapshotResult`（含 `nodes` / `stats` / `meta`）。

```ts
import { snapshot } from '@neo/dom-snapshot';

const result = snapshot();
// {
//   nodes: [
//     { id: 'e1', role: 'button',  name: '登录',     visible: true, rect: { x:0, y:0, width:0, height:0 }, text: '登录' },
//     { id: 'e2', role: 'textbox', name: 'email',    visible: true, rect: { ... }, value: '', placeholder: 'you@x.com', labeledBy: 'lbl-email' },
//     { id: 'e3', role: 'radio',   name: 'r-male',   visible: true, rect: { ... }, radioGroup: 'gender' },
//     ...
//   ],
//   stats: { total: 3, visible: 3, byRole: { button: 1, textbox: 1, radio: 1 }, approxChars: 412 },
//   meta:  { untrusted: true, sourceUrl: 'https://...', capturedAt: '2026-...', version: '0.2.0' },
// }

// 简洁拿 nodes
const { nodes, stats, meta } = snapshot();
```

#### Options

| 字段              | 类型                  | 默认值     | 说明                    |
| ----------------- | --------------------- | ---------- | ----------------------- |
| `root`            | `Element \| Document` | `document` | 扫描的根节点            |
| `include`         | `string[]`            | `[]`       | 强制纳入的 CSS Selector |
| `exclude`         | `string[]`            | `[]`       | 强制排除的 CSS Selector |
| `visibleOnly`     | `boolean`             | `true`     | 跳过不可见元素          |
| `interactiveOnly` | `boolean`             | `true`     | 设为 false 会同时包含 CONTENT(heading/label/cell/...) |
| `maxDepth`        | `number`              | `Infinity` | 限制遍历深度            |

> 💡 **3 层 role 分类**（v0.2 新增）：默认 `interactiveOnly=true` 收集 INTERACTIVE；`false` 额外收集 CONTENT（heading/label/cell/...）；STRUCTURAL（list/table/group）需通过 `include` 显式纳入。

### `click(id, result?)`

根据 `snapshot` 返回的 id 触发点击。`disabled` 元素会被拒绝。

```ts
import { snapshot, click } from '@neo/dom-snapshot';
const result = snapshot();
const r = click('e1', result);            // 新 API: 传 SnapshotResult
const r2 = click('e1', result.nodes);    // 旧 API: 传裸数组,仍兼容
if (!r.ok) console.warn(r.message);
```

### `fill(id, value, result?)`

给文本输入框设值并触发 `input` / `change` 事件。`disabled` 元素会被拒绝。用 native setter 写入，兼容 React/Vue。

```ts
import { snapshot, fill } from '@neo/dom-snapshot';
const result = snapshot();
fill('e2', 'you@example.com', result);
```

### `getElementById(id)`

直接拿到 id 对应的 DOM Element（用于更复杂操作）。每次 `snapshot()` 调用后会重置映射。

## SnapshotResult 结构

```ts
interface SnapshotResult {
  nodes: SnapshotNode[];   // 节点数组(深度优先顺序)
  stats: SnapshotStats;    // 统计信息(LLM token 估算)
  meta:  SnapshotMeta;     // 元信息(untrusted + 来源)
}
```

### `stats`

| 字段           | 类型                       | 说明                                              |
| -------------- | -------------------------- | ------------------------------------------------- |
| `total`        | `number`                   | 节点总数                                          |
| `visible`      | `number`                   | 其中 `visible=true` 的节点数                       |
| `byRole`       | `Record<string, number>`   | 按 role 分类计数,如 `{ button: 5, textbox: 3 }`     |
| `approxChars`  | `number`                   | 序列化后近似字符数（LLM token 估算依据）           |

### `meta`

| 字段         | 类型                  | 说明                                                |
| ------------ | --------------------- | --------------------------------------------------- |
| `untrusted`  | `true`                | 始终 true，作为 LLM 的安全标志（防御 prompt injection） |
| `sourceUrl`  | `string \| null`      | 捕获时所在 URL                                       |
| `capturedAt` | `string`              | ISO 8601 捕获时间                                    |
| `version`    | `string`              | 库版本                                              |

## SnapshotNode 字段

### 必填字段

| 字段      | 类型           | 说明                                        |
| --------- | -------------- | ------------------------------------------- |
| `id`      | `string`       | 稳定引用，`e1` / `e2` / ...                 |
| `role`    | `AriaRole`     | ARIA 角色，如 `button` / `textbox`          |
| `name`    | `string`       | accessible name（按 W3C 顺序计算）          |
| `visible` | `boolean`      | 元素是否视觉可见（不受 `visibleOnly` 影响） |
| `rect`    | `SnapshotRect` | `{ x, y, width, height }` 视口位置尺寸      |

### 可选字段（按需附加）

| 字段          | 类型       | 触发条件                                                                                                                                                                              |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `string`   | `input` / `textarea` / `select` 元素                                                                                                                                                  |
| `level`       | `number`   | `h1`–`h6` heading 元素（1–6）                                                                                                                                                         |
| `href`        | `string`   | `a` / `area` / `link` → href；`img` / `iframe` → src                                                                                                                                  |
| `checked`     | `boolean`  | `checkbox` / `radio` / `switch`，只在勾选时为 `true`                                                                                                                                  |
| `disabled`    | `boolean`  | `disabled` 属性 或 `aria-disabled="true"`，只在禁用时为 `true`                                                                                                                        |
| `placeholder` | `string`   | `input` / `textarea` 有非空 placeholder 时                                                                                                                                            |
| `text`        | `string`   | `button` / `link` / `option` / `tab` / `menuitem`(含 `menuitemcheckbox` / `menuitemradio`)的可见文字(textContent 折叠空白);与 `name` 区分: `name` 是 accessible name(可来自 data-testid/aria-label),`text` 是元素真实可见文字 |
| `labeledBy`   | `string`   | **v0.2 新增** 表单控件被 `<label for=...>` 关联时,记录 label 元素的 id(name 已通过 label 文本获得,这里只多记 id 让 LLM 知道来源)                                                          |
| `radioGroup`  | `string`   | **v0.2 新增** `radio` 按钮的 group 名: 优先 `name` 属性,退化到 fieldset legend 文本                                                                                                  |
| `states`      | `string[]` | 其他状态：`required` / `selected` / `expanded` / `collapsed`                                                                                                                          |
| `depth`       | `number`   | DOM 树深度（调试用）                                                                                                                                                                  |

### 行为变更记录

| 版本 | 变更                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| v0.1 | `disabled` 元素被默认过滤                                                                                       |
| v0.1 | `<label>` 自身不暴露 role,被关联 input 借用                                                                     |
| v0.2 | `disabled` 元素**不再过滤**,以 `disabled: true` 标注,让 LLM 看到"有但不能用"                                 |
| v0.2 | `<label>` / `<legend>` 独立作为 `label` role 出现在 snapshot(via `interactiveOnly=false`)                       |
| v0.2 | `<input type=search>` 角色从 `search`(landmark)修正为 `searchbox`(widget),不再冲突                              |
| v0.2 | `<fieldset>` 含 radio → `radiogroup`;否则 → `group`                                                            |
| v0.2 | 新增 `menuitemcheckbox` / `menuitemradio` / `treeitem` / `gridcell` 等 WAI-ARIA 标准角色                          |
| v0.2 | `snapshot()` 返回类型从 `SnapshotNode[]` 改为 `SnapshotResult`(breaking,见下)                                    |

## 推断规则

### role 3 层分类（v0.2）

- **INTERACTIVE**（默认收集）：button, link, textbox, searchbox, checkbox, radio, switch, combobox, listbox, option, menuitem, menuitemcheckbox, menuitemradio, tab, treeitem, slider, spinbutton, dialog
- **CONTENT**（`interactiveOnly=false` 时收集）：heading, label, img, cell, gridcell, columnheader, rowheader, listitem, article, form, region, progressbar, navigation, main, banner, contentinfo, search, complementary
- **STRUCTURAL**（默认排除，仅 `include` 强制）：group, radiogroup, list, menu, menubar, toolbar, tablist, table, row, rowgroup, grid, tree, treegrid, directory, document, application, generic, presentation, none

### role 推断顺序

1. 显式 `role` 属性
2. tagName + type 映射（`<button>`→`button`、`<input type=checkbox>`→`checkbox`、`<a href>`→`link`、`<h1-h6>`→`heading`、`<fieldset>+radio`→`radiogroup`、…）

### name（按 W3C 顺序）

1. `data-testid` ← **最高优先**，工程的"机器可读约定"
2. `aria-labelledby`
3. `aria-label`
4. `<label for="...">` 关联的 label
5. 元素自身 textContent
6. `title`
7. `placeholder`（仅 input/textarea）
8. `value`（仅 input[type=submit|reset|button]）
9. `alt`（仅 img）

### 过滤

- `display:none` / `visibility:hidden` / `aria-hidden=true`
- 零尺寸 + 元素子节点为空 + 无文本内容
- 空 name
- ❌ ~~disabled~~ （v0.2 已不再过滤）

## 浏览器 / 嵌入

库运行时依赖浏览器 DOM（document, window），不依赖任何框架。

### 原生页面

```html
<script type="module">
  import { snapshot } from './dist/dom-snapshot.js';
  console.log(snapshot());
</script>
```

### React 项目

```tsx
import { useEffect, useState } from 'react';
import { snapshot, click, fill, type SnapshotResult } from '@neo/dom-snapshot';

export function useDomSnapshot() {
  const [result, setResult] = useState<SnapshotResult | null>(null);
  useEffect(() => {
    setResult(snapshot());
  }, []);
  return {
    result,
    nodes: result?.nodes ?? [],
    click: (id: string) => result && click(id, result),
    fill: (id: string, v: string) => result && fill(id, v, result),
  };
}
```

## Breaking Changes (v0.1 → v0.2)

`snapshot()` 返回类型从 `SnapshotNode[]` 改为 `SnapshotResult`：

```diff
- const nodes = snapshot();
+ const { nodes, stats, meta } = snapshot();
```

旧 API 兼容方式：直接访问 `.nodes`。`click` / `fill` 的 `nodes` 参数同时接受 `SnapshotResult` 和 `SnapshotNode[]`（自动归一化）。

## License

MIT
