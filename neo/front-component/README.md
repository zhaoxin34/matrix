# @neo/front-component

> neo 的浏览器工程化组件库 —— 一个 npm 包,多个组件作为 subpath export。
> 当前收录: dom-snapshot(0.2)、aria-tree(计划中)、playwright-rpc(计划中)。

## 包含的组件

| 子路径                                  | 作用                                                                       | 版本 |
| --------------------------------------- | -------------------------------------------------------------------------- | ---- |
| [`@neo/front-component`](#)             | 入口 barrel(默认 re-export dom-snapshot)                                   | 0.2  |
| [`@neo/front-component/dom-snapshot`](#dom-snapshot) | 把 DOM 压成 LLM 友好的扁平结构(id/role/name/...)+ click/fill 双向操作 | 0.2  |
| `@neo/front-component/aria-tree`        | （计划中）从 ARIA tree 派生可访问性结构                                     | —    |
| `@neo/front-component/playwright-rpc`   | （计划中）封装 Playwright 远端调用                                          | —    |

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
│   ├── recording-ui-handoff.md
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

| Options          | 类型                  | 默认值     | 说明                       |
| ---------------- | --------------------- | ---------- | -------------------------- |
| `root`           | `Element \| Document` | `document` | 扫描的根节点                |
| `include`        | `string[]`            | `[]`       | 强制纳入的 CSS Selector    |
| `exclude`        | `string[]`            | `[]`       | 强制排除的 CSS Selector    |
| `visibleOnly`    | `boolean`             | `true`     | 跳过不可见元素              |
| `interactiveOnly`| `boolean`             | `true`     | false 额外收 CONTENT      |
| `maxDepth`       | `number`              | `Infinity` | 限制遍历深度                |

#### `click(id, result?)` / `fill(id, value, result?)`

```ts
import { click, fill } from '@neo/front-component';
const result = snapshot();
click('e1', result);
fill('e2', 'hello', result);
```

`disabled` 元素被拒绝。`fill` 用 native setter 写入,兼容 React/Vue。

## License

MIT
