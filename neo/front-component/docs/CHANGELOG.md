# CHANGELOG

## [0.3.0] - 2026-06-14

### 🏗️ 包重构:从单包单组件改为单包多组件

- **包名变更**: `@neo/dom-snapshot` → `@neo/front-component`(这是一次架构重打,不是不兼容演进)
- **目录结构**:
  - 源从 `src/*` 移到 `src/dom-snapshot/*`(为以后多组件让位)
  - 测试从 `tests/*` 移到 `tests/dom-snapshot/*`
  - Demo 从 `src/demo/*` 移到 `demo/dom-snapshot/*`
  - `index.html` 从根移到 `demo/dom-snapshot/`
  - 新增根 barrel `src/index.ts` 集中 re-export
- **subpath exports**: 
  - `import { ... } from '@neo/front-component'`(从 barrel 拿)
  - `import { ... } from '@neo/front-component/dom-snapshot'`(从子路径拿)
- **多组件布局已铺好**:
  - 未来加组件: 建 `src/<name>/` + `tests/<name>/` + `demo/<name>/`,在 `package.json` exports 加 subpath
  - 计划中: `aria-tree` / `playwright-rpc`
- **构建系统升级**:
  - `vite.config.ts` 改 multi-page(dev server 同时跑多组件 demo)
  - `vite.config.lib.ts` 改 multi-entry(lib build 同时产出多组件包)
- 153 测试全过,build OK,demo 跑通

### 迁移

```diff
- import { snapshot } from '@neo/dom-snapshot';
+ import { snapshot } from '@neo/front-component/dom-snapshot';
+ // 或
+ import { snapshot } from '@neo/front-component';
```

---

## [0.2.0] - 2026-06-13

### 🎯 主题

对齐 [browserclaw](https://github.com/idan-rubin/browserclaw) 的 snapshot 设计，补全缺失的 ARIA 角色，加上可观测性字段与安全标志。本版本参考 [`docs/plan-v0.2-browserclaw-alignment.md`](plan-v0.2-browserclaw-alignment.md) 分 4 个 phase 实施。

### ✨ 新增

#### Phase 1: 3 层 role 分类

- 引入 **INTERACTIVE / CONTENT / STRUCTURAL** 三层角色分类（对齐 WAI-ARIA 1.2 + browserclaw）
- 新增导出 `isContentRole` / `isStructuralRole` helper
- `isSemanticRole` 保留为向后兼容别名（= INTERACTIVE ∪ CONTENT）

补全缺失角色（共 9 个）：

| 角色               | 触发元素                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `label`            | `<label>` / `<legend>`                                                      |
| `radiogroup`       | `<fieldset>` 含 ≥1 个 `<input type=radio>`                                  |
| `group`            | `<fieldset>` 无 radio / `<details>`                                          |
| `searchbox`        | `<input type=search>`（之前错误映射为 `search` landmark）                     |
| `menuitemcheckbox` | `<div role=menuitemcheckbox>`                                              |
| `menuitemradio`    | `<div role=menuitemradio>`                                                 |
| `treeitem`         | `<div role=treeitem>`                                                      |
| `gridcell`         | `<div role=gridcell>`（之前无此角色，`<td>` 只能映射到 `cell`）                |
| `tabpanel`         | 之前已存在,加进文档                                                         |

#### Phase 2: `SnapshotResult` 输出结构（breaking）

- `snapshot()` 返回类型从 `SnapshotNode[]` 改为 `SnapshotResult`
- 新增 `SnapshotStats`（`total` / `visible` / `byRole` / `approxChars`）—— LLM token 估算依据
- 新增 `SnapshotMeta`（`untrusted: true` + `sourceUrl` + `capturedAt` + `version`）—— 安全标志 + 审计字段
- `LIB_VERSION = '0.2.0'` 常量,运行时通过 `meta.version` 暴露
- `click` / `fill` 的 `nodes` 参数同时接受 `SnapshotResult` 和 `SnapshotNode[]`(自动归一化)
- 暴露 `NodesInput` 公共类型

#### Phase 3: 关联字段

- 表单控件新增 `labeledBy: string` 字段（被 `<label for=...>` 关联时记录 label 的 id）
  - name 字段已通过 label 文本获得,labeledBy 只多记 id 让 LLM 知道 name 来源
- radio 按钮新增 `radioGroup: string` 字段
  - 优先从 `name` 属性获取
  - 无 `name` 时退化到祖先 `<fieldset>` 的 `<legend>` 文本

#### Phase 4: Demo + 文档

- `index.html` demo 加 `<fieldset>` / `<legend>` / `<label>` 控件,可视化展示新字段
- `src/demo/main.ts` 同步更新,右侧 JSON 同时显示 `nodes` / `stats` / `meta` 三块
- `README.md` 完整重写,字段表 + 行为变更表 + breaking change 迁移指南
- 本 `CHANGELOG.md`

### 🔄 行为变更

- **BREAKING**: `snapshot()` 返回类型从 `SnapshotNode[]` 改为 `SnapshotResult`
  - 迁移: `const { nodes, stats, meta } = snapshot()`
  - 旧写法 `const nodes = snapshot()` 不再编译,改为 `const { nodes } = snapshot()` 或 `const nodes = snapshot().nodes`
- **BREAKING(柔和)**: `click(id, nodes)` / `fill(id, value, nodes)` 现在优先接受 `SnapshotResult`;仍接受 `SnapshotNode[]` 做向后兼容
- `disabled` 元素不再被过滤,以 `disabled: true` 字段保留(v0.1 → v0.2 持续行为)
- `<label>` 元素**首次**作为独立节点出现在 snapshot(via `interactiveOnly=false`)
- `<input type=search>` 角色名从 `search` 修正为 `searchbox`(避免与 `search` landmark 角色冲突)

### 🧪 测试

- 95 → **153 测试**（+58,覆盖率覆盖所有新角色 + 3 层分类 + stats/meta + labeledBy + radioGroup）
- `npx vitest run` 全过
- `npx tsc --noEmit` 干净
- `npx prettier --check` 干净

### 📊 体积

| 产物             | 体积          | gzip         |
| ---------------- | ------------- | ------------ |
| `dom-snapshot.js` (ESM) | 10.6 KB | 3.4 KB       |
| `dom-snapshot.cjs`      | 8.2 KB  | 3.0 KB       |
| 5 个 `d.ts` 文件         | -            | -            |

### 📋 参考

- [设计灵感来源：browserclaw](https://github.com/idan-rubin/browserclaw)
- [WAI-ARIA 1.2 Roles 规范](https://www.w3.org/TR/wai-aria-1.2/#role_definitions)
- [实施路线图](plan-v0.2-browserclaw-alignment.md)

---

## [0.1.0] - 2026-06-13

首次发布,实现基础的 `snapshot` / `click` / `fill` API。

- 14 个 SnapshotNode 字段（id/role/name/visible/rect/value/level/href/checked/disabled/placeholder/text/states/depth）
- 95 单测
- Vite + TS Library 模式,产出 ESM + CJS + d.ts
- 自带 demo 页面(make dev 跑在 5100)
