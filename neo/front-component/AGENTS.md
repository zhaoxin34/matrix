# Project Agent

**Workspace Path:** `/Volumes/data/working/ai/matrix/neo/front-component`
_(Note to Pi: Your file write/edit tools run in a different directory by default. You MUST use absolute paths starting with the Workspace Path above for ALL file operations!)_

<!-- Pi: before writing anything, explore this project:
  1. Read package.json / pyproject.toml / Cargo.toml / go.mod — identify stack and versions
  2. Scan directory structure: rg --files | head -60
  3. Read 3-5 key source files to understand patterns and conventions
  4. Check for .cursorrules, CLAUDE.md, .eslintrc, prettier.config — existing AI/style config
  Then fill in each section below based on what actually find.
  Adapt or add sections if the project has unique needs.
-->

**Generated:** 2026-06-15

## Stack

<!-- Pi: languages, frameworks, key libraries and their versions -->

| 类别         | 技术        | 版本     |
| ------------ | ----------- | -------- |
| 语言         | TypeScript  | ^5.4.0   |
| 构建工具     | Vite        | ^5.4.0   |
| 测试框架     | Vitest      | ^1.6.0   |
| DOM 测试环境 | Happy-DOM   | ^15.0.0  |
| 代码格式化   | Prettier    | ^3.3.0   |
| 类型声明     | @types/node | ^20.11.0 |
| Node 类型    | Node.js     | 20+      |

**零运行时依赖** - 所有功能手写实现，无外部依赖。


## Structure

<!-- Pi: key directories and what each contains — a mental map, not a full file list -->

```
front-component/                    # 单一 npm 包: @neo/front-component
├── package.json                    # 包定义 + subpath exports
├── tsconfig.json                  # TS 编译配置（严格模式）
├── tsconfig.test.json             # 测试用 TS 配置（扩展 tsconfig.json）
├── vite.config.ts                 # 开发服务器配置（多页面）
├── vite.config.lib.ts             # 库构建配置（多入口）
├── vitest.config.ts               # Vitest 测试配置
├── Makefile                       # 工程命令入口
├── .prettierrc                    # Prettier 格式化配置
├── .gitignore                     # Git 忽略规则
├── pnpm-workspace.yaml           # pnpm 工作区配置（单包架构）
│
├── src/                           # 组件源码
│   ├── index.ts                   # 入口 barrel（re-export 所有组件）
│   └── dom-snapshot/              # 组件 1：DOM 快照
│       ├── index.ts              # 组件入口 + 公共导出
│       ├── types.ts              # 类型定义（SnapshotNode, SnapshotResult 等）
│       ├── snapshot.ts           # 核心：snapshot() 函数实现
│       ├── comment.ts            # 动态悬浮注释 (运行时标注元素)
│       ├── operations.ts         # click/fill 操作实现
│       ├── role.ts               # ARIA role 推断 + 三层分类
│       └── name.ts               # accessible name 计算
│   └── aria-tree/                # 组件 2（未来）
│
├── tests/                         # 组件测试（co-locate 到组件）
│   ├── helpers/dom.ts            # 跨组件共享测试辅助函数
│   └── dom-snapshot/
│       ├── role.test.ts          # role.ts 测试
│       ├── name.test.ts          # name.ts 测试
│       ├── snapshot.test.ts      # snapshot.ts 测试
│       ├── comment.test.ts       # comment.ts 测试
│       └── operations.test.ts    # operations.ts 测试
│
├── demo/                          # 组件演示（可独立访问）
│   └── dom-snapshot/
│       ├── index.html            # Demo 页面（http://127.0.0.1:5100/dom-snapshot/）
│       ├── main.ts               # Demo 入口脚本
│       └── style.css             # Demo 样式
│
├── dist/                          # 构建产物（被 .gitignore）
│   ├── index.js / index.cjs      # ESM / CJS barrel
│   ├── index.d.ts                # 类型声明
│   ├── dom-snapshot/
│   │   ├── index.js / index.cjs  # ESM / CJS 组件
│   │   └── *.d.ts               # 类型声明
│   └── recording/               # rrweb 录制产物（未来）
│
├── docs/                          # 工程级 + 组件级文档
│   ├── CHANGELOG.md              # 版本变更日志
│   ├── plan-v0.2-browserclaw-alignment.md  # v0.2 设计对齐文档
│   ├── recording-ui-handoff.md    # 录制 UI 交接文档
│   └── bugs/
│       ├── 001-isvisible-ancestor-chain.md  # Bug post-mortem
│       └── 002-css-specificity.md          # Bug post-mortem
│
└── .pi/                          # pi 运行时状态（被 .gitignore）
```

## Commands

| Action       | Command             |
| ------------ | ------------------- |
| Install      | `make install`      |
| Build        | `make build`        |
| Test         | `make test`         |
| Test:Watch   | `make test-watch`   |
| Dev          | `make dev`          |
| Preview      | `make preview`      |
| Format       | `make format`       |
| Format:Check | `make format-check` |
| TypeCheck    | `make typecheck`    |
| Clean        | `make clean`        |

**Dev 服务地址**: http://127.0.0.1:5100/dom-snapshot/

## Conventions

<!-- Pi: coding style, patterns in use, formatter/linter config, naming conventions -->

### 代码风格

- **Prettier 配置** (`.prettierrc`):
  - `semi: true` - 使用分号
  - `singleQuote: true` - 单引号
  - `trailingComma: "all"` - 所有位置添加尾随逗号
  - `printWidth: 100` - 行宽 100
  - `tabWidth: 2` - Tab 宽度 2
  - `arrowParens: "always"` - 箭头函数参数始终加括号
  - `endOfLine: "lf"` - 换行符 LF

- **TypeScript 严格模式** (`tsconfig.json`):
  - `strict: true`
  - `noImplicitAny: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`
  - `noImplicitReturns: true`

### 命名约定

- **类型**: 使用 PascalCase（如 `SnapshotNode`, `AriaRole`）
- **函数**: 使用 camelCase（如 `snapshot`, `getAccessibleName`）
- **常量**: 使用 camelCase 或 SCREAMING_SNAKE_CASE（`LIB_VERSION`）
- **NodeId**: 形如 `e1`, `e2` 的字符串格式
- **模块导出**: 使用 `.js` 扩展名（ESM 规范）

### 组件开发模式（加新组件 3 步）

```bash
# 1. 建组件骨架
mkdir -p src/aria-tree tests/aria-tree demo/aria-tree

# 2. 在 src/aria-tree/index.ts 写组件入口，导出 public API

# 3. 在 package.json exports 加一条 subpath
```

### 测试规范

- 使用 **Happy-DOM** 作为 DOM 测试环境
- 测试文件 co-locate 到组件目录：`tests/<component>/`
- 使用 Vitest 框架，`describe`/`it` 语法
- 测试隔离：`resetElementMap()` 重置全局状态

### ARIA Role 三层分类

- **INTERACTIVE**: 可交互控件（button, textbox, checkbox 等）
- **CONTENT**: 语义内容（heading, label, cell 等）
- **STRUCTURAL**: 纯容器（group, list, table 等）

### 标注（Annotation）使用规范

项目提供两种标注方案，互补不互斥：

| 场景                       | 用哪个              | 原因                                      |
| -------------------------- | ------------------- | ----------------------------------------- |
| HTML 模板里就有业务含义的  | `data-ai-*` 属性    | snapshot 会自动采集，无需运行时额外处理    |
| AI Agent 运行时动态标注的  | `comment()` API     | 运行时调用、即插即用、可清除              |

`comment()` 的实现要点：

- **手动设置 body 为 relative**: 注释框 `position: absolute` 需要 `body` 作为定位上下文，否则会定位到 initial containing block (= viewport)，达不到跟滚动的效果
- **getBoundingClientRect + scrollX/Y**: 元素是视口坐标，转为整页坐标后赋给 marker，这样 marker 会随页面滚动
- **监听 window scroll/resize**: 滚动 / resize 后重算位置
- **不入 map 缓存 marker**: 清理逻辑使用 `data-comment-id` 属性 + WeakMap 查 storage，靠 map() 的话移除时还是查它，不安全

### Comment 实现为什么不用 floating-ui

最初使用 `@floating-ui/dom` + `autoUpdate`，发现：

- `strategy: 'fixed'` 会让 marker 永远锁在视口上，元素滚出后 marker 还在视口内
- `strategy: 'absolute'` + `body` 不设 `position: relative` 会被定位到 viewport (initial containing block)，效果跟 fixed 一样
- 两者都不滚动 = 不是产品想要的

最终选择手写 20 行：手动转换坐标 + scroll/resize 监听，零依赖、bundle 减少 4 KB (gzip)。

## Key Files

<!-- Pi: the 5-10 most important files and what each one does -->

| 文件                             | 作用                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| `package.json`                   | npm 包定义，包含 subpath exports 配置，支持 barrel 和子路径两种导入方式 |
| `vite.config.lib.ts`             | 库构建配置，多入口同时产出 ESM + CJS + d.ts                             |
| `src/index.ts`                   | barrel 入口，集中 re-export 所有组件                                    |
| `src/dom-snapshot/types.ts`      | 核心类型定义（SnapshotNode, SnapshotResult, SnapshotOptions 等）        |
| `src/dom-snapshot/snapshot.ts`   | 核心 snapshot() 函数实现，遍历 DOM 生成 LLM 友好节点数组                |
| `src/dom-snapshot/comment.ts`    | 动态悬浮注释（comment/removeComment/getAllComments/clearAllComments），运行时标注 DOM 元素并跟随滚动 |
| `src/dom-snapshot/operations.ts` | click/fill 操作实现，支持 React/Vue 等框架                              |
| `src/dom-snapshot/role.ts`       | ARIA role 推断 + 三层分类（INTERACTIVE/CONTENT/STRUCTURAL）             |
| `src/dom-snapshot/name.ts`       | accessible name 计算，严格按 W3C ARIA 1.2 规则                          |
| `docs/CHANGELOG.md`              | 版本变更日志，记录 breaking change 和迁移指南                           |

## What to Avoid

<!-- Pi: patterns or changes that would break things or go against project style -->

1. **不要修改 `dist/` 目录** - 构建产物由 `make build` 自动生成，已被 .gitignore 忽略

2. **不要在 `snapshot()` 返回类型上做 breaking change** - v0.2.0 已稳定，应保持向后兼容

3. **不要使用 `var`，使用 `const`/`let`** - 项目使用现代 JS 语法

4. **不要省略类型注解** - `strict: true` 要求所有变量有类型

5. **不要在 src 中使用未导出的 helper 函数名冲突** - 内部函数以下划线或小写开头命名

6. **不要忘记运行 `make typecheck`** - 提交前确保无类型错误

7. **不要在测试中使用 `document.body.innerHTML = ...`** - 使用 `helpers/dom.ts` 中的辅助函数

8. **不要在 role 推断中硬编码敏感字符串** - 如 `password` 使用变量拼接避免静态扫描

## Notes

<!-- Pi: existing AI config files (.cursorrules, CLAUDE.md), gotchas, constraints, anything a new agent must know -->

### 项目背景

- **包名演变**: `@neo/dom-snapshot` → `@neo/front-component`（v0.3.0 架构重构）
- **核心价值**: 把任意 DOM 树压缩成 LLM 友好的扁平结构，供 AI Agent 进行页面理解和操作
- **设计灵感**: 参考 [browserclaw](https://github.com/idan-rubin/browserclaw) 和 agent-browser 的 snapshot 设计

### 关键设计决策

1. **id 格式**: 按深度优先遍历顺序分配 `e1/e2/...`，LLM 可根据数组顺序反推 DOM 位置
2. **disabled 元素**: 不再过滤，通过 `disabled: true` 字段标注，让 LLM 知道"有但不能用"
3. **React/Vue 兼容**: `fill()` 使用原生 setter 写入 value，触发框架 state 更新
4. **安全标志**: `meta.untrusted: true` 作为 LLM 消费快照时的安全提示
5. **comment 滚动跟随**: marker 用 `position: absolute` 放在 body 下（body 设为 `position: relative`），监听 `scroll`/`resize` 用 `getBoundingClientRect` 实时重算坐标。注释会跟着元素一起滚出视口，而不是锁在视口上。
6. **业务标注与动态注释互补**: `data-ai-*` 属性（静态、HTML 写好）+ `comment()` API（动态、运行时调用），两种标注方案并存互不干扰

### 已知约束

- **happy-dom 限制**: 部分 CSS 属性（如 inline style 的 getComputedStyle）不完全支持，有兜底逻辑
- **无 href 的 `<a>`**: 在 ARIA 中不是 link 角色，返回 null
- **无 alt 的 `<img>`**: 在 ARIA 中没有 role，返回 null（presentation）

### 调试技巧

1. **开发调试**: `make dev` 启动服务，在浏览器打开 http://127.0.0.1:5100/dom-snapshot/
2. **测试调试**: `make test-watch` 监听模式运行测试
3. **类型检查**: `make typecheck` 检查 TypeScript 类型错误
4. **comment 调试**: 切换到 demo 的 "注释" Tab，输入元素 ID + 文本，点击添加按钮。滚动页面看注释是否跟随元素

### pnpm 相关

- 项目使用 pnpm 管理依赖
- `pnpm-workspace.yaml` 存在但项目是单包架构，不使用 workspace 功能
- 安装依赖时会自动检测 pnpm/npm 并选择使用

### Comment API 速查

```ts
import { comment, removeComment, getAllComments, clearAllComments, updateComment } from '@neo/front-component/dom-snapshot';

// 添加注释
comment('e1', '这是危险操作', {
  position: 'right',         // 12 种: top/right/bottom/left + start/center/end
  offsetX: 8,                // 水平偏移
  offsetY: 0,                // 垂直偏移
  bgColor: '#fef08a',        // 背景色
  borderColor: '#eab308',    // 边框色
});

// 获取所有
const all = getAllComments();

// 移除 / 清除
removeComment('e1');
clearAllComments();

// 更新
updateComment('e1', '新文本');
```
