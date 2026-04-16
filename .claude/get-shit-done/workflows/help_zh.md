<purpose>
Display the complete GSD command reference. Output ONLY the reference content. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
</purpose>

<reference>
# GSD 命令参考

**GSD** (Get Shit Done / 把事做完) 创建分层项目计划，优化用于 Claude Code 的独立智能体开发。

## 快速开始

1. `/gsd-new-project` - 初始化项目（含研究、需求、路线图）
2. `/gsd-plan-phase 1` - 为第一阶段创建详细计划
3. `/gsd-execute-phase 1` - 执行该阶段

## 保持更新

GSD 进化很快。请定期更新：

```bash
npx get-shit-done-cc@latest
```

## 核心工作流程

```
/gsd-new-project → /gsd-plan-phase → /gsd-execute-phase → 循环
```

### 项目初始化

**`/gsd-new-project`**
通过统一流程初始化新项目。

一条命令带你从想法到可规划：
- 深度提问以理解你要构建的内容
- 可选的领域研究（启动 4 个并行研究智能体）
- 需求定义（含 v1/v2/范围外的范围界定）
- 路线图创建（含阶段分解和成功标准）

创建所有 `.planning/` 产物：
- `PROJECT.md` — 愿景和需求
- `config.json` — 工作流模式（交互式/yolo）
- `research/` — 领域研究（如果选择）
- `REQUIREMENTS.md` — 带 REQ-ID 的范围化需求
- `ROADMAP.md` — 映射到需求的阶段
- `STATE.md` — 项目记忆

用法：`/gsd-new-project`

**`/gsd-map-codebase`**
为现有代码库创建映射（ brownfield 项目）。

- 使用并行 Explore 智能体分析代码库
- 创建 `.planning/codebase/` 含 7 个专注文档
- 涵盖技术栈、架构、结构、规范、测试、集成、关注点
- 在现有代码库上使用 `/gsd-new-project` 之前先运行此命令

用法：`/gsd-map-codebase`

### 阶段规划

**`/gsd-discuss-phase <number>`**
在规划前帮助阐明你对阶段的愿景。

- 捕获你想象中这个阶段如何运作
- 创建 CONTEXT.md 含你的愿景、要点和边界
- 当你对某事物应该如何看起来/感觉有想法时使用
- 可选的 `--batch` 一次问 2-5 个相关问题而不是逐个问

用法：`/gsd-discuss-phase 2`
用法：`/gsd-discuss-phase 2 --batch`
用法：`/gsd-discuss-phase 2 --batch=3`

**`/gsd-research-phase <number>`**
针对小众/复杂领域的全面生态系统研究。

- 发现标准技术栈、架构模式、陷阱
- 创建 RESEARCH.md 含"专家如何构建这个"的知识
- 用于 3D、游戏、音频、着色器、ML 及其他专业领域
- 超越"哪个库"到生态系统知识

用法：`/gsd-research-phase 3`

**`/gsd-list-phase-assumptions <number>`**
在看 Claude 计划做什么之前了解它的假设。

- 显示 Claude 对阶段的预期方法
- 让你在 Claude 误解你的愿景时进行纠正
- 不创建文件 - 仅对话输出

用法：`/gsd-list-phase-assumptions 3`

**`/gsd-plan-phase <number>`**
为特定阶段创建详细执行计划。

- 生成 `.planning/phases/XX-phase-name/XX-YY-PLAN.md`
- 将阶段分解为具体的、可操作的任务
- 包含验证标准和成功衡量标准
- 每个阶段支持多个计划（XX-01、XX-02 等）

用法：`/gsd-plan-phase 1`
结果：创建 `.planning/phases/01-foundation/01-01-PLAN.md`

**PRD 快递路径：** 传递 `--prd path/to/requirements.md` 完全跳过讨论阶段。你的 PRD 成为 CONTEXT.md 中的锁定决策。当你已经拥有清晰的验收标准时很有用。

### 执行

**`/gsd-execute-phase <phase-number>`**
执行阶段中的所有计划，或运行特定 wave。

- 按 wave 分组计划（来自 frontmatter），顺序执行
- 每个 wave 内的计划通过 Task 工具并行运行
- 可选的 `--wave N` 标志仅执行 Wave `N` 并停止，除非阶段现已完成
- 所有计划完成后验证阶段目标
- 更新 REQUIREMENTS.md、ROADMAP.md、STATE.md

用法：`/gsd-execute-phase 5`
用法：`/gsd-execute-phase 5 --wave 2`

### 智能路由

**`/gsd-do <description>`**
自动将自由文本路由到正确的 GSD 命令。

- 分析自然语言输入以找到最佳匹配 GSD 命令
- 作为调度器 - 从不自己工作
- 通过让你在最佳匹配之间选择来解决歧义
- 当你知道想要什么但不知道运行哪个 `/gsd-*` 命令时使用

用法：`/gsd-do 修复登录按钮`
用法：`/gsd-do 重构认证系统`
用法：`/gsd-do 我想开始一个新的里程碑`

### 快速模式

**`/gsd-quick [--full] [--validate] [--discuss] [--research]`**
用 GSD 保证执行小型 ad-hoc 任务，但跳过可选的智能体。

快速模式使用相同系统但路径更短：
- 生成 planner + executor（默认跳过 researcher、checker、verifier）
- 快速任务存在于 `.planning/quick/`（与计划阶段分开）
- 更新 STATE.md 跟踪（不是 ROADMAP.md）

标志启用额外的质量步骤：
- `--full` — 完整质量流程：讨论 + 研究 + 计划检查 + 验证
- `--validate` — 仅计划检查（最多 2 次迭代）和执行后验证
- `--discuss` — 轻量级讨论以在规划前揭示灰色地带
- `--research` — 专注研究智能体在规划前调查方法

粒度标志可组合：`--discuss --research --validate` 等同于 `--full`。

用法：`/gsd-quick`
用法：`/gsd-quick --full`
用法：`/gsd-quick --research --validate`
结果：创建 `.planning/quick/NNN-slug/PLAN.md`、`.planning/quick/NNN-slug/SUMMARY.md`

---

**`/gsd-fast [description]`**
内联执行琐碎任务 - 无子智能体、无计划文件、无开销。

对于小到不值得规划的任务：拼写修正、配置更改、忘记的提交、简单添加。在当前上下文中运行，进行更改，提交，并记录到 STATE.md。

- 不创建 PLAN.md 或 SUMMARY.md
- 不生成子智能体（内联运行）
- ≤ 3 个文件编辑 - 如果任务不简单则重定向到 `/gsd-quick`
- 原子提交，使用常规提交信息

用法：`/gsd-fast "修复 README 中的拼写错误"`
用法：`/gsd-fast "添加 .env 到 gitignore"`

### 路线图管理

**`/gsd-add-phase <description>`**
将新阶段添加到当前里程碑末尾。

- 追加到 ROADMAP.md
- 使用下一个顺序号
- 更新阶段目录结构

用法：`/gsd-add-phase "添加管理后台"`

**`/gsd-insert-phase <after> <description>`**
作为小数阶段插入紧急工作，介于现有阶段之间。

- 创建中间阶段（例如 7.1 在 7 和 8 之间）
- 用于在里程碑中途发现的必须做的工作
- 保持阶段排序

用法：`/gsd-insert-phase 7 "修复关键认证 bug"`
结果：创建阶段 7.1

**`/gsd-remove-phase <number>`**
删除未来阶段并重新编号后续阶段。

- 删除阶段目录和所有引用
- 重新编号所有后续阶段以关闭间隙
- 仅对未来（未开始）阶段有效
- Git 提交保留历史记录

用法：`/gsd-remove-phase 17`
结果：阶段 17 删除，阶段 18-20 变成 17-19

### 里程碑管理

**`/gsd-new-milestone <name>`**
通过统一流程开始新里程碑。

- 深度提问以理解你接下来要构建什么
- 可选的领域研究（启动 4 个并行研究智能体）
- 需求定义含范围界定
- 路线图创建含阶段分解
- 可选的 `--reset-phase-numbers` 标志将编号重置为阶段 1 并首先归档旧阶段目录以确保安全

反映现有项目的 `/gsd-new-project` 流程（现有 PROJECT.md）。

用法：`/gsd-new-milestone "v2.0 功能"`
用法：`/gsd-new-milestone --reset-phase-numbers "v2.0 功能"`

**`/gsd-complete-milestone <version>`**
归档完成的里程碑并准备下一版本。

- 创建带统计的 MILESTONES.md 条目
- 将完整详情归档到 milestones/ 目录
- 为发布创建 git 标签
- 准备下一版本的工作空间

用法：`/gsd-complete-milestone 1.0.0`

### 进度跟踪

**`/gsd-progress`**
检查项目状态并智能路由到下一步操作。

- 显示可视化进度条和完成百分比
- 从 SUMMARY 文件汇总最近工作
- 显示当前位置和下一步
- 列出关键决策和开放问题
- 提供执行下一计划或创建它（如果缺失）
- 检测 100% 里程碑完成

用法：`/gsd-progress`

### 会话管理

**`/gsd-resume-work`**
通过完整上下文恢复进行先前会话的工作。

- 读取 STATE.md 获取项目上下文
- 显示当前位置和最近进度
- 根据项目状态提供下一步操作

用法：`/gsd-resume-work`

**`/gsd-pause-work`**
在暂停工作中途创建上下文交接。

- 创建带当前状态的 .continue-here 文件
- 更新 STATE.md 会话连续性部分
- 捕获进行中工作的上下文

用法：`/gsd-pause-work`

### 调试

**`/gsd-debug [issue description]`**
跨上下文重置的持久状态系统调试。

- 通过适应性提问收集症状
- 创建 `.planning/debug/[slug].md` 跟踪调查
- 使用科学方法研究（证据 → 假设 → 测试）
- 在 `/clear` 中存活 - 用无参数运行 `/gsd-debug` 继续
- 将已解决的问题归档到 `.planning/debug/resolved/`

用法：`/gsd-debug "登录按钮不工作"`
用法：`/gsd-debug`（继续活动会话）

### 快速笔记

**`/gsd-note <text>`**
零摩擦想法捕获 - 一条命令，即时保存，无问题。

- 将带时间戳的笔记保存到 `.planning/notes/`（或全局保存到 `/Volumes/data/working/ai/matrix/.claude/notes/`）
- 三个子命令：追加（默认）、列表、提升
- 提升将笔记转换为结构化待办
- 无项目也可工作（回退到全局范围）

用法：`/gsd-note 重构钩子系统`
用法：`/gsd-note 列表`
用法：`/gsd-note 提升 3`
用法：`/gsd-note --global 跨项目想法`

### 待办管理

**`/gsd-add-todo [description]`**
从当前对话中捕获想法或任务。

- 从对话中提取上下文（或使用提供的描述）
- 在 `.planning/todos/pending/` 中创建结构化待办文件
- 从文件路径推断区域以进行分组
- 创建前检查重复项
- 更新 STATE.md 待办计数

用法：`/gsd-add-todo`（从对话推断）
用法：`/gsd-add-todo 添加 auth token 刷新`

**`/gsd-check-todos [area]`**
列出待办并选择一个来处理。

- 列出所有待办含标题、区域、时长
- 可选区域过滤器（例如 `/gsd-check-todos api`）
- 加载所选待办的完整上下文
- 路由到适当操作（现在工作、添加到阶段、集思广益）
- 工作开始时将待办移至 done/

用法：`/gsd-check-todos`
用法：`/gsd-check-todos api`

### 用户验收测试

**`/gsd-verify-work [phase]`**
通过对话式 UAT 验证构建的功能。

- 从 SUMMARY.md 文件中提取可测试的交付物
- 一次一个呈现测试（是/否响应）
- 自动诊断失败并创建修复计划
- 如发现问题可重新执行

用法：`/gsd-verify-work 3`

### 交付工作

**`/gsd-ship [phase]`**
从完成的阶段工作中创建 PR，带自动生成的主体。

- 推送分支到远程
- 从 SUMMARY.md、VERIFICATION.md、REQUIREMENTS.md 创建 PR 摘要
- 可选请求代码审查
- 更新 STATE.md 交付状态

前置条件：阶段已验证，`gh` CLI 已安装并认证。

用法：`/gsd-ship 4` 或 `/gsd-ship 4 --draft`

---

**`/gsd-review --phase N [--gemini] [--claude] [--codex] [--coderabbit] [--opencode] [--qwen] [--cursor] [--all]`**
跨 AI 同伴审查 - 调用外部 AI CLI 独立审查阶段计划。

- 检测可用的 CLI（gemini、claude、codex、coderabbit）
- 每个 CLI 用相同的结构化提示独立审查计划
- CodeRabbit 审查当前 git diff（不是提示）- 可能需要最多 5 分钟
- 生成 REVIEWS.md 含每个审查者的反馈和共识摘要
- 将审查反馈纳入规划：`/gsd-plan-phase N --reviews`

用法：`/gsd-review --phase 3 --all`

---

**`/gsd-pr-branch [target]`**
通过过滤掉 .planning/ 提交来创建干净的 PR 分支。

- 对提交分类：仅代码（包含）、仅规划（排除）、混合（包含sans .planning/）
- 将代码提交 cherry-pick 到干净分支
- 审查者只看到代码更改，没有 GSD 产物

用法：`/gsd-pr-branch` 或 `/gsd-pr-branch main`

---

**`/gsd-plant-seed [idea]`**
捕获具有自动浮现触发条件的前瞻性想法。

- 种子保留 WHY、WHEN 浮现、以及相关代码的面包屑
- 当触发条件匹配时在 `/gsd-new-milestone` 期间自动浮现
- 比延迟项更好 - 触发器被检查，不会被遗忘

用法：`/gsd-plant-seed "当我们构建事件系统时添加实时通知"`

---

**`/gsd-audit-uat`**
所有待处理 UAT 和验证项的跨阶段审计。
- 扫描每个阶段的待处理、跳过、阻塞和需要人工项
- 与代码库交叉引用以检测过时文档
- 生成按可测试性分组的优先人工测试计划
- 在开始新里程碑之前使用以清除验证债务

用法：`/gsd-audit-uat`

### 里程碑审计

**`/gsd-audit-milestone [version]`**
根据原始意图审计里程碑完成情况。

- 读取所有阶段 VERIFICATION.md 文件
- 检查需求覆盖
- 为跨阶段布线生成集成检查器
- 创建带差距和技术债务的 MILESTONE-AUDIT.md

用法：`/gsd-audit-milestone`

**`/gsd-plan-milestone-gaps`**
创建阶段以关闭审计发现的差距。

- 读取 MILESTONE-AUDIT.md 并将差距分组为阶段
- 按需求优先级排序（必须/应该/很好）
- 将差距关闭阶段添加到 ROADMAP.md
- 准备好在新阶段上 `/gsd-plan-phase`

用法：`/gsd-plan-milestone-gaps`

### 配置

**`/gsd-settings`**
交互式配置工作流开关和模型配置文件。

- 切换 researcher、plan checker、verifier 智能体
- 选择模型配置文件（quality/balanced/budget/inherit）
- 更新 `.planning/config.json`

用法：`/gsd-settings`

**`/gsd-set-profile <profile>`**
快速切换 GSD 智能体的模型配置文件。

- `quality` — 除验证外到处使用 Opus
- `balanced` — 规划用 Opus，执行用 Sonnet（默认）
- `budget` — 写作用 Sonnet，研究/验证用 Haiku
- `inherit` — 对所有智能体使用当前会话模型（OpenCode `/model`）

用法：`/gsd-set-profile budget`

### 实用命令

**`/gsd-cleanup`**
归档已完成后积累的阶段目录。

- 识别仍存在于 `.planning/phases/` 中已完成里程碑的阶段
- 在移动任何内容之前显示干运行摘要
- 将阶段目录移动到 `.planning/milestones/v{X.Y}-phases/`
- 在多个里程碑后使用以减少 `.planning/phases/` 混乱

用法：`/gsd-cleanup`

**`/gsd-help`**
显示此命令参考。

**`/gsd-update`**
更新 GSD 到最新版本并显示变更日志预览。

- 显示已安装与最新版本比较
- 显示你错过的版本的变更日志条目
- 突出显示重大变更
- 在运行安装前确认
- 比原始 `npx get-shit-done-cc` 更好

用法：`/gsd-update`

**`/gsd-join-discord`**
加入 GSD Discord 社区。

- 获取帮助、分享你正在构建的内容、保持更新
- 与其他 GSD 用户联系

用法：`/gsd-join-discord`

## 文件与结构

```
.planning/
├── PROJECT.md            # 项目愿景
├── ROADMAP.md            # 当前阶段分解
├── STATE.md              # 项目记忆和上下文
├── RETROSPECTIVE.md      # 活的回顾（每个里程碑更新）
├── config.json           # 工作流模式和门控
├── todos/                # 捕获的想法和任务
│   ├── pending/          # 等待处理的待办
│   └── done/             # 已完成的待办
├── debug/                # 活动调试会话
│   └── resolved/         # 已归档解决的问题
├── milestones/
│   ├── v1.0-ROADMAP.md       # 归档的路线图快照
│   ├── v1.0-REQUIREMENTS.md  # 归档的需求
│   └── v1.0-phases/          # 归档的阶段目录（通过 /gsd-cleanup 或 --archive-phases）
│       ├── 01-foundation/
│       └── 02-core-features/
├── codebase/             # 代码库映射（brownfield 项目）
│   ├── STACK.md          # 语言、框架、依赖
│   ├── ARCHITECTURE.md   # 模式、层、数据流
│   ├── STRUCTURE.md      # 目录布局、关键文件
│   ├── CONVENTIONS.md    # 编码标准、命名
│   ├── TESTING.md        # 测试设置、模式
│   ├── INTEGRATIONS.md   # 外部服务、API
│   └── CONCERNS.md       # 技术债务、已知问题
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   └── 01-01-SUMMARY.md
    └── 02-core-features/
        ├── 02-01-PLAN.md
        └── 02-01-SUMMARY.md
```

## 工作流模式

在 `/gsd-new-project` 期间设置：

**交互式模式**

- 确认每个主要决策
- 在检查点暂停等待批准
- 全程更多指导

**YOLO 模式**

- 自动批准大多数决策
- 执行计划无需确认
- 仅在关键检查点停止

随时通过编辑 `.planning/config.json` 更改

## 规划配置

在 `.planning/config.json` 中配置规划产物的管理方式：

**`planning.commit_docs`**（默认：`true`）
- `true`：规划产物提交到 git（标准工作流）
- `false`：规划产物保留在本地，不提交

当 `commit_docs: false` 时：
- 将 `.planning/` 添加到你的 `.gitignore`
- 用于 OSS 贡献、客户项目或保持规划私密
- 所有规划文件仍正常工作，只是不在 git 中跟踪

**`planning.search_gitignored`**（默认：`false`）
- `true`：为广泛 ripgrep 搜索添加 `--no-ignore`
- 仅当 `.planning/` 被 gitignore 且你希望项目范围搜索包含它时才需要

示例配置：
```json
{
  "planning": {
    "commit_docs": false,
    "search_gitignored": true
  }
}
```

## 常见工作流程

**开始新项目：**

```
/gsd-new-project        # 统一流程：提问 → 研究 → 需求 → 路线图
/clear
/gsd-plan-phase 1       # 为第一阶段创建计划
/clear
/gsd-execute-phase 1    # 执行阶段中的所有计划
```

**中断后恢复工作：**

```
/gsd-progress  # 查看你进展到哪里并继续
```

**在里程碑中途添加紧急工作：**

```
/gsd-insert-phase 5 "关键安全修复"
/gsd-plan-phase 5.1
/gsd-execute-phase 5.1
```

**完成里程碑：**

```
/gsd-complete-milestone 1.0.0
/clear
/gsd-new-milestone  # 开始下一里程碑（提问 → 研究 → 需求 → 路线图）
```

**在工作期间捕获想法：**

```
/gsd-add-todo                    # 从对话上下文捕获
/gsd-add-todo 修复模态框 z-index  # 带明确描述捕获
/gsd-check-todos                 # 审查和处理待办
/gsd-check-todos api             # 按区域筛选
```

**调试问题：**

```
/gsd-debug "表单提交静默失败"  # 开始调试会话
# ... 调查发生，上下文中填充 ...
/clear
/gsd-debug                                    # 从你离开的地方继续
```

## 获取帮助

- 阅读 `.planning/PROJECT.md` 了解项目愿景
- 阅读 `.planning/STATE.md` 了解当前上下文
- 检查 `.planning/ROADMAP.md` 了解阶段状态
- 运行 `/gsd-progress` 检查你进展到哪里
</reference>
