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

## Key Files

<!-- Pi: the 5-10 most important files and what each one does -->

| 文件                             | 作用                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| `package.json`                   | npm 包定义，包含 subpath exports 配置，支持 barrel 和子路径两种导入方式 |
| `vite.config.lib.ts`             | 库构建配置，多入口同时产出 ESM + CJS + d.ts                             |
| `src/index.ts`                   | barrel 入口，集中 re-export 所有组件                                    |
| `src/dom-snapshot/types.ts`      | 核心类型定义（SnapshotNode, SnapshotResult, SnapshotOptions 等）        |
| `src/dom-snapshot/snapshot.ts`   | 核心 snapshot() 函数实现，遍历 DOM 生成 LLM 友好节点数组                |
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

### 已知约束

- **happy-dom 限制**: 部分 CSS 属性（如 inline style 的 getComputedStyle）不完全支持，有兜底逻辑
- **无 href 的 `<a>`**: 在 ARIA 中不是 link 角色，返回 null
- **无 alt 的 `<img>`**: 在 ARIA 中没有 role，返回 null（presentation）

### 调试技巧

1. **开发调试**: `make dev` 启动服务，在浏览器打开 http://127.0.0.1:5100/dom-snapshot/
2. **测试调试**: `make test-watch` 监听模式运行测试
3. **类型检查**: `make typecheck` 检查 TypeScript 类型错误

### pnpm 相关

- 项目使用 pnpm 管理依赖
- `pnpm-workspace.yaml` 存在但项目是单包架构，不使用 workspace 功能
- 安装依赖时会自动检测 pnpm/npm 并选择使用
