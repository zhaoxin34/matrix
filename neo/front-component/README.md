# @neo/dom-snapshot

> 把任意 DOM 树压缩成 LLM 友好的扁平结构 (`id` / `role` / `name` / `visible` / `rect` …)，并提供 `click` / `fill` 双向操作能力。

受 [agent-browser](https://github.com/saikirandulla/agent-browser) snapshot 启发，做成可独立嵌入任何项目（React、Vue、原生、Bookmarklet…）的库。

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

扫描 DOM 树，输出稳定的 `e1/e2/...` 编号数组。

```ts
import { snapshot } from '@neo/dom-snapshot';

const nodes = snapshot();
// [
//   { id: 'e1', role: 'button',    name: '登录',     visible: true, rect: { x:0, y:0, width:0, height:0 }, text: '登录' },
//   { id: 'e2', role: 'button',    name: '注册',     visible: true, rect: { ... }, text: '注册' },
//   { id: 'e3', role: 'textbox',   name: 'search',   visible: true, rect: { ... }, value: '', placeholder: '搜索商品' },
//   { id: 'e4', role: 'checkbox',  name: 'remember', visible: true, rect: { ... } },
//   { id: 'e5', role: 'link',      name: 'nav-help', visible: true, rect: { ... }, href: '/help', text: '需要帮助' },
// ]
```

#### Options

| 字段              | 类型                  | 默认值     | 说明                    |
| ----------------- | --------------------- | ---------- | ----------------------- |
| `root`            | `Element \| Document` | `document` | 扫描的根节点            |
| `include`         | `string[]`            | `[]`       | 强制纳入的 CSS Selector |
| `exclude`         | `string[]`            | `[]`       | 强制排除的 CSS Selector |
| `visibleOnly`     | `boolean`             | `true`     | 跳过不可见元素          |
| `interactiveOnly` | `boolean`             | `true`     | 只保留可交互 + 语义元素 |
| `maxDepth`        | `number`              | `Infinity` | 限制遍历深度            |

### `click(id, nodes?)`

根据 `snapshot` 输出的 id 触发点击。`disabled` 元素会被拒绝。

```ts
import { snapshot, click } from '@neo/dom-snapshot';
const nodes = snapshot();
const r = click('e1', nodes);
if (!r.ok) console.warn(r.message);
```

### `fill(id, value, nodes?)`

给文本输入框设值并触发 `input` / `change` 事件。`disabled` 元素会被拒绝。用 native setter 写入，兼容 React/Vue。

```ts
import { snapshot, fill } from '@neo/dom-snapshot';
const nodes = snapshot();
fill('e3', '手机', nodes);
```

### `getElementById(id)`

直接拿到 id 对应的 DOM Element（用于更复杂操作）。

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
| `text`        | `string`   | `button` / `link` / `option` / `tab` / `menuitem` 的可见文字(textContent 折叠空白);与 `name` 区分: `name` 是 accessible name(可来自 data-testid/aria-label),`text` 是元素真实可见文字 |
| `states`      | `string[]` | 其他状态：`required` / `selected` / `expanded` / `collapsed`                                                                                                                          |
| `depth`       | `number`   | DOM 树深度（调试用）                                                                                                                                                                  |

> ⚠️ **行为变更**：`disabled` 元素**不再被过滤**。它们以 `disabled: true` 字段保留在结果中，让 LLM 看到"有但不能用"。`click` / `fill` 操作会自动拒绝 `disabled` 元素。

## 推断规则

### role

1. 显式 `role` 属性
2. tagName + type 映射（`<button>`→`button`、`<input type=checkbox>`→`checkbox`、`<a href>`→`link`、`<h1-h6>`→`heading`、…）

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
- ❌ ~~disabled~~ （已不再过滤）

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
import { snapshot, click, fill, type SnapshotNode } from '@neo/dom-snapshot';

export function useDomSnapshot() {
  const [nodes, setNodes] = useState<SnapshotNode[]>([]);
  useEffect(() => {
    setNodes(snapshot());
  }, []);
  return {
    nodes,
    click: (id: string) => click(id, nodes),
    fill: (id: string, v: string) => fill(id, v, nodes),
  };
}
```

## License

MIT
