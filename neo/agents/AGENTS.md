# Project Agent

**Workspace Path:** `/Volumes/data/working/ai/matrix/neo/agents`
*(Note to Pi: Your file write/edit tools run in a different directory by default. You MUST use absolute paths starting with the Workspace Path above for ALL file operations!)*

**Generated:** 2026-06-18

> 这是 Neo 项目下的 `agents/` 子工程，独立的 monorepo 风格布局。
> 完整 Neo 项目根目录 (`/Volumes/data/working/ai/matrix/neo/`) 包含 backend、frontend、agent-steer、design、ui、e2e-test 等模块；本目录只包含把 `@earendil-works/pi-coding-agent` SDK 包装成 Web UI 的两个子项目。

## Stack

| 层 | 技术 | 版本 |
|----|------|------|
| 核心 SDK | `@earendil-works/pi-coding-agent` | ^0.79.0 |
| AI 适配层 | `@earendil-works/pi-ai` | ^0.79.0 |
| 后端框架 | Next.js (App Router + API routes) | 16.2.1 |
| 前端构建 | Vite | ^6.0.0 |
| UI 库 | React + React DOM | ^19.2.4 |
| 类型系统 | TypeScript (strict) | ^5 |
| 样式 | Tailwind CSS v4 (CSS-based @theme) | ^4.2.2 |
| Lint | ESLint flat config | ^9 |
| Markdown | `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` | latest |
| 代码高亮 | `react-syntax-highlighter` | ^16 |
| 图标 | `@lobehub/icons` | ^5 |
| 流程图 | `mermaid` | ^11 |
| 公式 | `katex` | ^0.16 |
| 字体 | `@fontsource/noto-sans-mono` (self-hosted) | ^5 |
| 文档解析 | `mammoth` (.docx) | ^1.12 |

## Structure

```
agents/                                # 根目录（本 AGENTS.md 在此）
├── AGENTS.md                          # 本文件 — Agent 项目指南
├── agent-server/                      # 后端 — Next.js 16 + React 19
│   ├── app/api/                       # API 路由（按功能切分）
│   │   ├── agent/[id]/                # 单个 agent 会话
│   │   │   ├── route.ts               # GET 状态 / POST 命令
│   │   │   └── events/route.ts        # GET SSE 事件流
│   │   ├── agent/new/route.ts         # POST 创建新会话
│   │   ├── auth/                      # 多 Provider 认证
│   │   │   ├── all-providers/         # 列出全部已配置 Provider
│   │   │   ├── api-key/[provider]/    # 配置 API Key
│   │   │   ├── login/[provider]/      # OAuth 登录回调
│   │   │   ├── logout/[provider]/     # 登出
│   │   │   └── providers/             # 列出可用 Provider
│   │   ├── cwd/validate/route.ts      # 工作目录校验
│   │   ├── default-cwd/route.ts       # 默认工作目录
│   │   ├── files/[...path]/route.ts   # 文件浏览
│   │   ├── home/route.ts              # 首页元数据
│   │   ├── models/route.ts            # 模型列表
│   │   ├── models-config/             # 模型配置 (含 /test)
│   │   ├── sessions/                  # 会话 CRUD
│   │   │   ├── route.ts               # 列表 / 创建
│   │   │   ├── [id]/route.ts          # 单会话
│   │   │   ├── [id]/context/route.ts  # 会话上下文
│   │   │   ├── [id]/export/route.ts   # 导出会话
│   │   │   └── new/route.ts
│   │   └── skills/                    # 技能管理
│   │       ├── route.ts               # 列表 / 切换 disable-model-invocation
│   │       ├── search/route.ts        # 远程搜索技能
│   │       └── install/route.ts       # 安装技能
│   ├── lib/                           # 共享库（不依赖 Next.js App Router）
│   │   ├── rpc-manager.ts             # ⭐ AgentSession 包装 + 命令派发
│   │   ├── session-reader.ts          # 会话读取 + 路径缓存
│   │   ├── types.ts                   # 会话/上下文/树节点类型
│   │   ├── pi-types.ts                # SDK 表面类型（解耦）
│   │   ├── normalize.ts               # 工具调用归一化
│   │   └── npx.ts                     # npx 工具函数
│   ├── bin/pi-web.js                  # CLI 入口（next start 包装）
│   ├── docs/                          # 技能 / 文档
│   ├── middleware.ts                  # CORS 中间件（仅 /api/*）
│   ├── next.config.ts                 # serverExternalPackages + LAN 允许
│   ├── eslint.config.mjs
│   └── tsconfig.json
└── agent-ui/                          # 前端 — Vite 6 + React 19 SPA
    ├── src/
    │   ├── App.tsx                    # 顶层壳 <AppShell/>
    │   ├── main.tsx                   # Vite 入口（createRoot）
    │   ├── index.css                  # Tailwind v4 @import + 主题变量
    │   ├── components/                # 业务组件
    │   │   ├── AppShell.tsx           # ⭐ 顶层布局 + 全局状态
    │   │   ├── ChatWindow.tsx         # 对话主窗
    │   │   ├── ChatInput.tsx          # 输入框（图片附件、@引用、命令）
    │   │   ├── ChatMinimap.tsx        # 对话小地图
    │   │   ├── MessageView.tsx        # 单条消息渲染
    │   │   ├── MarkdownBody.tsx       # Markdown 主体（mermaid + katex）
    │   │   ├── ToolPanel.tsx          # 工具调用面板
    │   │   ├── BranchNavigator.tsx    # 会话分支导航
    │   │   ├── SessionSidebar.tsx     # 左侧会话列表
    │   │   ├── FileExplorer.tsx       # 文件树
    │   │   ├── FileViewer.tsx         # 文件查看
    │   │   ├── FileIcons.tsx          # 文件类型图标
    │   │   ├── TabBar.tsx             # 多 Tab
    │   │   ├── ModelsConfig.tsx       # 模型配置弹窗
    │   │   └── SkillsConfig.tsx       # 技能配置弹窗
    │   ├── hooks/
    │   │   ├── useAgentSession.ts     # ⭐ SSE 订阅 + 命令发送
    │   │   ├── useAudio.ts            # 音频提示
    │   │   ├── useDragDrop.ts         # 拖拽上传
    │   │   ├── useTheme.ts            # 明暗主题
    │   │   └── useUrlSearchParams.ts  # URL 参数解析
    │   └── lib/
    │       ├── api-base.ts            # ⭐ apiUrl() 单一源
    │       ├── agent-client.ts        # ⭐ sendAgentCommand()
    │       ├── normalize.ts           # 工具调用归一化（前端版本）
    │       ├── types.ts               # AgentMessage / SessionInfo / ...
    │       ├── url.ts                 # URL 工具
    │       └── file-paths.ts          # 路径显示/截断
    ├── public/favicon.ico
    ├── vite.config.ts                 # 端口 30143，@ -> ./src 别名
    ├── tailwind.config.ts             # content globs
    ├── eslint.config.mjs
    └── tsconfig.json
```

## Commands

| Action  | Backend (`agent-server`)                       | Frontend (`agent-ui`)            |
|---------|------------------------------------------------|----------------------------------|
| Install | `cd agent-server && npm install`               | `cd agent-ui && npm install`     |
| Dev     | `npm run dev` → `next dev -p 30141`            | `npm run dev` → `vite` (30143)   |
| Build   | `npm run build` → `next build --webpack`       | `npm run build` → `tsc -b && vite build` |
| Start   | `npm start` → `next start -p 30141`            | `npm run preview`                |
| Lint    | `npm run lint` → `eslint .`                    | `npm run lint` → `eslint .`      |
| Type-check | `npm run type-check` → `tsc --noEmit`        | `npm run typecheck` → `tsc -b --noEmit` |
| Release | `npm run release` (bump + build + publish)     | —                                |

> 启动顺序：先启动后端 (`agent-server`)，再启动前端 (`agent-ui`)。前端通过 `VITE_API_URL` 找到后端，未设置时默认同源回退。

## Conventions

### 代码风格
- **TypeScript strict mode** 双子项目都开；`tsc --noEmit` 必须零错误
- **路径别名** `@/*`：
  - 后端 → 仓库根（`agent-server/tsconfig.json`）
  - 前端 → `./src/*`（`agent-ui/tsconfig.json`）
- **React 19 + StrictMode** 在前端 `main.tsx` 开启
- **ESLint flat config**（`eslint.config.mjs`），**不是** 旧 `.eslintrc`
- 后端额外套用 `eslint-config-next/core-web-vitals` + `typescript`，但显式关闭 `react-hooks/immutability`、`react-hooks/refs`、`react-hooks/set-state-in-effect`（Next.js 默认对动态流场景太严）
- 前端只用 `eslint-plugin-react-hooks` + `@typescript-eslint/parser`，**不**用 `eslint-config-next`（已迁移到 Vite，Next 规则不再适用）
- `globalThis.__xxx` 缓存 Map 用于热重载安全（`__piSessions`、`__piSessionPathCache`、`__piStartLocks`）

### API 响应格式
所有 `/api/*` 端点统一返回：
```ts
{ success: true, data: T }   // 成功
{ error: string }            // 失败（非 2xx）
```
前端 `sendAgentCommand()` 严格按此解包。

### CORS / 跨域
- `middleware.ts` 只对 `/api/*` 应用 CORS，反射请求 `Origin`（**不**用 `*` + credentials）
- `OPTIONS` 预检 204 短路，不进入 route handler
- `next.config.ts` 的 `allowedDevOrigins: ['192.168.*.*']` 允许 LAN 内前端访问
- 前端通过 `apiUrl(path)` 走 `VITE_API_URL`（生产）或同源（dev）

### 样式
- Tailwind v4 不再用 `tailwind.config.js` 配置主题，全部在 `src/index.css` 用 `@theme` 块
- 主题颜色用 CSS 变量（`--bg`、`--accent`...），`html.dark` 切换
- 自定义字体通过 `@fontsource` 自我托管，不再用 `next/font`

### SSE / 流式
- 后端 `/api/agent/[id]/events`：`ReadableStream` + `data: {json}\n\n`
- 30 秒心跳（`:\n\n` 注释帧）防止代理超时
- 通过 `req.signal.abort` 检测客户端断开

### 进程内 Session 管理
- `AgentSessionWrapper` 包装 pi SDK 的 `AgentSession`，提供统一事件总线
- 闲置 10 分钟自动 `destroy()`
- 全局 Map 缓存活跃 session，支持启动锁防并发创建

## Key Files

| 文件 | 作用 |
|------|------|
| `agent-server/lib/rpc-manager.ts` | **核心**：把 pi SDK 的 `AgentSession` 包装成命令派发器（`prompt` / `abort` / `fork` / `navigate_tree` / `compact` / `steer` / `set_model` / `set_tools` / ...） |
| `agent-server/lib/session-reader.ts` | 会话文件系统读取 + `globalThis` 路径缓存 |
| `agent-server/app/api/agent/[id]/route.ts` | POST 命令 / GET 状态的标准路由 |
| `agent-server/app/api/agent/[id]/events/route.ts` | SSE 事件流实现（带心跳 + 断连清理） |
| `agent-server/middleware.ts` | CORS 中间件，反射 Origin + OPTIONS 预检短路 |
| `agent-server/next.config.ts` | `serverExternalPackages`（让 pi SDK 不被 webpack 打包）+ LAN origin + 版本注入 |
| `agent-server/bin/pi-web.js` | CLI 启动脚本，包装 `next start` + 自动打开浏览器 |
| `agent-ui/src/components/AppShell.tsx` | **顶层布局**：组合 Sidebar + Chat + FileViewer + Tab + Branch + Skills 弹窗 |
| `agent-ui/src/hooks/useAgentSession.ts` | **核心 hook**：SSE 订阅 + 流式状态机 + 命令发送 + 树/分支/系统提示词管理 |
| `agent-ui/src/lib/api-base.ts` | `apiUrl()` 单一源；`VITE_API_URL` 环境变量 |
| `agent-ui/src/lib/agent-client.ts` | `sendAgentCommand<T>()` 统一 fetch 包装 |
| `agent-ui/src/components/MarkdownBody.tsx` | Markdown 渲染管线（GFM + math + 代码高亮 + mermaid） |
| `agent-ui/src/components/ChatInput.tsx` | 输入框：图片附件、@ 文件引用、命令补全 |
| `agent-ui/vite.config.ts` | Vite 配置：端口 30143、`@` 别名、版本 define |

## What to Avoid

- ❌ **不要**在 `lib/*.ts` 里 `import from "next/server"` — `lib/` 设计为可在 Node 直接运行，不依赖 Next App Router。`pi-types.ts` 是 SDK 表面类型解耦的关键。
- ❌ **不要**用 `eslint-config-next` 给前端 (`agent-ui`)，它已迁到 Vite，Next 规则不适用。前端用 `eslint-plugin-react-hooks` + `@typescript-eslint/parser`。
- ❌ **不要**在 SSE 路由里返回 CORS 头时用 `Access-Control-Allow-Origin: *` 配 credentials — 会触发浏览器错误。`middleware.ts` 选择反射 Origin 是有意的。
- ❌ **不要**把 `tools: string[]` 传成空数组来表示「使用全部工具」— 0.68+ 含义是「全部禁用」。看 `rpc-manager.ts` 的 `allCodingToolNames` 常量注释。
- ❌ **不要**手动遍历 `pathEntries` 来找 compaction 边界 — 用 `findCutPoint()`，它处理 `isSplitTurn` 边界情况（见 `rpc-manager.ts` 的 `compact` 分支）。
- ❌ **不要**用 `react-hooks/set-state-in-effect` 规则 — 在流式 UI 场景（持续 SSE 事件）下它会产生伪报警，前后端 ESLint 都已显式关闭。
- ❌ **不要**改 `globalThis.__piSessions` / `__piStartLocks` / `__piSessionPathCache` 名字 — 热重载安全依赖这些 key 稳定。
- ❌ **不要**在客户端直接 import `@earendil-works/pi-coding-agent` — 这是 server-only 包，Vite 打包会爆。前端只用 `lib/agent-client.ts` 走 HTTP。
- ❌ **不要**在 `agent-ui/src/` 用 `process.env.NEXT_PUBLIC_*` — Vite 客户端只暴露 `VITE_*`（迁移注释见 `vite.config.ts`）。

## Notes

### 部署形态
- 这是 **个人 / LAN 部署**（不是公网 SaaS），CORS / 认证都按信任网络设计
- 默认端口：后端 30141（`PORT` env 可改）、前端 30143（hardcoded `strictPort: true`）
- `bin/pi-web.js` 会监听 `next start` 的 "Ready" 日志自动用 `open` / `xdg-open` / `start` 打开浏览器

### 与 pi SDK 的版本耦合
- `package.json` 把 `@earendil-works/pi-coding-agent` 和 `@earendil-works/pi-ai` 锁在 `^0.79.0`
- `rpc-manager.ts` 大量假设 0.68+ 之后 `createAgentSession` 的 `tools: string[]` API
- 升 SDK 主版本前先看 `lib/pi-types.ts` 的 `AgentSessionLike` 接口是否还匹配

### 已知的迁移点（来自代码注释）
- 旧的 Next.js 整体 monorepo 拆成独立 `agent-server` + `agent-ui`（Vite SPA 替换了原 Next.js frontend）
- `next/font/google` → `@fontsource`（Vite 不支持 next/font）
- `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`
- 旧的 PostCSS tailwind 配置 → Tailwind v4 的 `@tailwindcss/vite` 插件 + CSS `@theme`

### 缺失项（需要补的）
- **没有**测试目录（无 `tests/` / `__tests__/`）— 这是一个 UI 工具型项目，依赖手动验证
- **没有**根级 `Makefile` / `package.json` — 两个子项目独立 `npm install`
- **没有** CI 配置（`.github/` / `.gitlab-ci.yml`）
- `AGENTS.md` 模板（当前文件） — 等待 Agent 在第一次会话里填完

### 子项目无独立 AGENTS.md
- `agent-server/AGENTS.md` / `agent-ui/AGENTS.md` **不**存在；所有约定集中在**根** `agents/AGENTS.md`（即本文件）
