# @neo/front-component

> neo 的浏览器工程化组件库 —— 一个 npm 包,多个组件作为 subpath export。
> 当前收录: dom-snapshot(0.2)、aria-tree(计划中)、playwright-rpc(计划中)。

## 包含的组件

| 子路径                                               | 作用                                                                  | 版本 |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ---- |
| [`@neo/front-component`](#)                          | 入口 barrel(默认 re-export dom-snapshot)                              | 0.2  |
| [`@neo/front-component/dom-snapshot`](#dom-snapshot) | 把 DOM 压成 LLM 友好的扁平结构(id/role/name/...)+ click/fill 双向操作 | 0.2  |

## 快速开始

```bash
make install      # 安装依赖
make dev          # 启动所有组件 demo (http://127.0.0.1:5100)
make test         # 跑单测(全部组件)
make build        # 构建 ESM + CJS + d.ts(所有组件)
```

## 安装 & 使用

```bash
pnpm add @neo/front-component
```

按需引用组件:

```ts
// 方式 1: 从 barrel 拿(一次性)
import { snapshot, click, fill } from '@neo/front-component';

// 方式 2: 按 subpath 拿(更显式)
import { snapshot } from '@neo/front-component/dom-snapshot';
```

## 工程结构

```
front-component/                    # 单一 npm 包: @neo/front-component
├── package.json                     # subpath exports
├── tsconfig.json + tsconfig.test.json
├── vite.config.ts                   # dev server, multi-page (各组件 demo)
├── vite.config.lib.ts               # lib build, multi-entry
├── vitest.config.ts
├── Makefile, README.md
├── docs/                            # 工程级 + 组件级文档
│   ├── CHANGELOG.md
│   ├── plan-v0.2-browserclaw-alignment.md
│   └── bugs/                        # 跨组件 bug post-mortems
├── src/                             # 组件源码
│   ├── index.ts                     # 入口 barrel
│   ├── dom-snapshot/                # 组件 1
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── role.ts
│   │   ├── name.ts
│   │   ├── snapshot.ts
│   │   └── operations.ts
│   └── aria-tree/                   # 组件 2(以后)
├── tests/                           # 组件测试,co-locate 到组件
│   ├── helpers/dom.ts               # 跨组件共享
│   └── dom-snapshot/
│       ├── role.test.ts
│       ├── name.test.ts
│       ├── snapshot.test.ts
│       └── operations.test.ts
└── demo/                            # 组件 demo,可独立访问
    └── dom-snapshot/
        ├── index.html               # http://127.0.0.1:5100/dom-snapshot/
        ├── main.ts
        └── style.css
```

## 加新组件 3 步

```bash
# 1. 建组件骨架
mkdir -p src/aria-tree tests/aria-tree demo/aria-tree

# 2. 在 src/aria-tree/index.ts 写组件入口,导出 public API

# 3. 在 package.json exports 加一条:
#    "./aria-tree": {
#      "types": "./dist/aria-tree/index.d.ts",
#      "import": "./dist/aria-tree/index.js",
#      "require": "./dist/aria-tree/index.cjs"
#    }
```

## 组件 API 参考

### `dom-snapshot`

受 [browserclaw](https://github.com/idan-rubin/browserclaw) 和 agent-browser 的 snapshot 设计启发。
详见: [docs/plan-v0.2-browserclaw-alignment.md](docs/plan-v0.2-browserclaw-alignment.md)

#### 业务标注 (data-ai-\*)

通过在 HTML 元素上添加 `data-ai-*` 属性,可以给元素附加业务语义,帮助 LLM 理解元素的业务含义:

```html
<!-- 危险操作 -->
<button data-ai-desc="此操作不可逆，请谨慎" data-ai-type="dangerous-action">删除订单</button>

<!-- 敏感数据输入 -->
<input data-ai-context="登录密码" data-ai-type="sensitive-data" placeholder="请输入密码" />

<!-- 重要操作 -->
<button data-ai-desc="确认后将提交订单" data-ai-type="important-action">确认支付</button>
```

`snapshot()` 会自动收集这些属性并附加到节点上:

```ts
const result = snapshot();
console.log(result.nodes[0].business);
// {
//   desc: '此操作不可逆，请谨慎',
//   type: 'dangerous-action'
// }
```

| data-ai 属性      | 作用       | 示例                              |
| ----------------- | ---------- | --------------------------------- |
| `data-ai-desc`    | 业务描述   | `data-ai-desc="请谨慎操作"`       |
| `data-ai-type`    | 业务类型   | `data-ai-type="dangerous-action"` |
| `data-ai-context` | 业务上下文 | `data-ai-context="收货人手机号"`  |

**BusinessType 预定义类型**:

| 类型               | 含义                              |
| ------------------ | --------------------------------- |
| `dangerous-action` | 危险操作,如删除、取消等不可逆操作 |
| `sensitive-data`   | 敏感数据操作,如密码、验证码等     |
| `important-action` | 重要操作,如提交订单、支付等       |
| `navigation`       | 导航操作,如跳转页面               |
| `form-input`       | 表单输入,如文本输入               |

#### 动态悬浮注释 (comment)

运行时调用 `comment()` 在元素边上显示悬浮标签，与 `data-ai-*` 静态标注互补：

- `data-ai-*`：HTML 里写好，snapshot 时收集
- `comment()`：运行时调用，即时显示

```ts
import {
  snapshot,
  comment,
  removeComment,
  getAllComments,
  clearAllComments,
  updateComment,
} from '@neo/front-component';

// 1. 先调用 snapshot() 获取元素 id
const result = snapshot();

// 2. 给指定元素添加注释（显示在元素右下角）
comment('e1', '这是一个危险操作');

// 3. 获取所有注释
const all = getAllComments();
// [{ id: 'e1', text: '这是一个危险操作', element: Element }, ...]

// 4. 更新已有注释
updateComment('e1', '新的注释文本');

// 5. 移除某个注释
removeComment('e1');

// 6. 清除所有注释
clearAllComments();

// 带配置项
comment('e1', '提示', {
  bgColor: '#fef08a', // 背景色（默认黄色）
  textColor: '#713f12', // 文字色
  maxWidth: '200px', // 最大宽度
  autoHideMs: 5000, // 5秒后自动消失
});
```

**CommentRecord 类型**：

```ts
interface CommentRecord {
  id: string; // 元素 id（e1, e2...），与 snapshot 输出的 id 一致
  text: string; // 注释文本内容
  element: Element; // 原始 DOM 元素
}
```

#### `snapshot(root?, options?)`

```ts
import { snapshot } from '@neo/front-component';

const result = snapshot();
// {
//   nodes: [{ id, role, name, visible, rect, value?, text?, ... }],
//   stats: { total, visible, byRole, approxChars },
//   meta:  { untrusted, sourceUrl, capturedAt, version }
// }
```

| Options           | 类型                  | 默认值     | 说明                    |
| ----------------- | --------------------- | ---------- | ----------------------- |
| `root`            | `Element \| Document` | `document` | 扫描的根节点            |
| `include`         | `string[]`            | `[]`       | 强制纳入的 CSS Selector |
| `exclude`         | `string[]`            | `[]`       | 强制排除的 CSS Selector |
| `visibleOnly`     | `boolean`             | `true`     | 跳过不可见元素          |
| `interactiveOnly` | `boolean`             | `true`     | false 额外收 CONTENT    |
| `maxDepth`        | `number`              | `Infinity` | 限制遍历深度            |

#### `click(id, result?)` / `fill(id, value, result?)`

```ts
import { click, fill } from '@neo/front-component';
const result = snapshot();
click('e1', result);
fill('e2', 'hello', result);
```

`disabled` 元素被拒绝。`fill` 用 native setter 写入,兼容 React/Vue。

## 体积

| 产物                          | 体积    | gzip   |
| ----------------------------- | ------- | ------ |
| `dom-snapshot/index.js` (ESM) | 17.2 KB | 5.5 KB |
| `dom-snapshot/index.cjs`      | 13.7 KB | 5.0 KB |

## License

MIT
