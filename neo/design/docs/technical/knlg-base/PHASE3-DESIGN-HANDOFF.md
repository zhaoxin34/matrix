---
id: phase3-design-handoff
title: "Phase 3 技术设计 — 工作指导 Handoff"
sidebar_position: 99
author: Joky.Zhao
created: 2026-07-01
updated: 2026-07-01
version: 1.0.0
tags: [knowledge-base, phase3, design, handoff, llm, agent]
---

# Phase 3 技术设计 — 工作指导 Handoff

> **受众**：技术设计人员（接手 Phase 3 的 AI/后端/前端设计）
> **目的**：在 2-3 天内交付 Phase 3 的 3 个缺失技术设计文档
> **不重复**：本文档只指路与决策点，不重述已有内容。请按"阅读清单"按顺序消化后再动笔。

---

## 0. TL;DR — 一句话总结

**Phase 1 + 2 已完成（手录入问答库闭环 + MySQL FULLTEXT 中文检索 + 数据看板）。Phase 3 要做的是让 AI 代替人工发起访谈。技术栈核心是"复用现成 agent-server，不重复造 LLM Gateway"，3 个设计文档（04 / 05 / 06）需要在动手前先把 3 个空白决策敲定。**

---

## 1. 背景与上下文

### 1.1 项目当前状态（截至 2026-07-01）

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 1 W1-W4 | 19 张 knlg_* 表 + 58 endpoint + 18 页面 + 状态机 | ✅ 完成 |
| Phase 2 W5-W7 | 问题树模板 + ngram FULLTEXT 中文检索 + 数据看板 + bulk 导入导出 | ✅ 完成 |
| **Phase 3 W8-W10** | **LLM 接入 + AI 访谈 Agent MVP** | **⏳ 待设计 + 待实施** |

**Git 历史**（最近 5 次）：

```
e8417c3e fix(knlg-base): stats page setStats data.data
5a8e364f refactor(knlg-base): Phase 2 simplify
10e2764a chore(knlg-base): Phase 2 verification fixes
5f34fd16 feat(knlg-base): Phase 2 W5/W6/W7
1490c2c0 docs(roadmap): mark Phase 1 + MVP m1 as completed
```

### 1.2 Phase 3 的产品价值

**当前痛点**：访谈完全靠产品经理手敲问题（专家被动回答），效率低 + 覆盖面窄。

**Phase 3 目标**：AI 主动发起访谈，根据专家回答动态追问，自动标注信号 → 半自动萃取知识卡。

详细产品设计见：

- [`design/docs/product/knlg-base/q-a-library.md`](../../product/knlg-base/q-a-library)
- [`design/docs/product/knlg-base/extraction-flow.md`](../../product/knlg-base/extraction-flow)（如有）
- [`design/docs/product/knlg-base/implementation-roadmap.md`](../../product/knlg-base/implementation-roadmap)（第 3.2 节里程碑 + 第 4 节 Phase 3 任务表）

---

## 2. 你的交付物清单

| 文档 | 路径 | 行数估计 | 必含内容 |
|---|---|---|---|
| **04-llm-gateway.md** | `technical/knlg-base/04-llm-gateway.md` | ~400 行 | 架构图 + 接入方式（复用 agent-server 决策）+ 限流/降级 + 错误码 + API 契约 |
| **05-prompt-management.md** | `technical/knlg-base/05-prompt-management.md` | ~300 行 | KnlgLlmPrompt 表用法 + 版本控制 + A/B 框架 + 编辑器 UI 设计 + 缓存策略 |
| **06-interview-agent.md** | `technical/knlg-base/06-interview-agent.md` | ~700 行 | 状态机 + 追问决策逻辑 + 信号识别 + SSE 协议 + DB schema + 前端流式 UI |

**总计 ~1400 行**，2-3 天可以交付。

---

## 3. 阅读清单（按顺序消化）

### 3.1 必读 — knlg-base 已有文档（~1 小时）

| 顺序 | 文档 | 关注点 |
|---|---|---|
| 1 | [`01-database-schema.md`](./01-database-schema) | 理解 19 张表的命名规范、状态机字段约定（status / created_by / workspace_id 必填）|
| 2 | [`02-backend-api.md`](./02-backend-api) | 理解 API 路径规范、错误码体系（ERR_NOT_FOUND 等）、分页约定 |
| 3 | [`03-frontend-modules.md`](./03-frontend-modules) | 理解前端 shadcn UI 模式 + 表单/对话框/列表的标准结构 |
| 4 | [`index.md`](./index) | 第 2.2 节列出了 04/05/06 三个待写文档的预期范围 |

### 3.2 必读 — 已有 LLM schema（~20 分钟）

```
backend/src/app/models/knlg_llm_model.py        # 50 行
backend/src/app/models/knlg_llm_prompt.py       # 75 行
backend/src/app/models/knlg_llm_provider.py     # 51 行
```

**关键点**：

- `KnlgLlmProvider` 定义 provider（OpenAI / Anthropic / 国内模型）
- `KnlgLlmModel` 定义具体模型（gpt-4o / claude-3.5 / qwen-max 等）
- `KnlgLlmPrompt` 定义可管理的 Prompt 模板（含 version 字段，支持版本控制）
- **schema 已存在但还没建表**（没有 migration），需要你决定：
  - 用现有 schema 直接 alembic 升级？
  - 还是根据你的设计调整 schema？

### 3.3 必读 — 现成 LLM Gateway（~30 分钟）

**关键发现**：**`/Volumes/data/working/ai/neo-agents/agent-server/` 是一个已实现的完整 LLM Gateway**，跑在 port 30141，使用 `@earendil-works/pi-coding-agent` SDK。

| 端点 | 路径 | 作用 |
|---|---|---|
| `GET /api/models` | `app/api/models/route.ts` | 列出所有可用模型（已支持多 provider） |
| `GET /api/models-config` | `app/api/models-config/route.ts` | 模型配置 |
| `POST /api/agent/[id]/new` | `app/api/agent/[id]/new/route.ts` | 启动新 agent session |
| `POST /api/sessions` | `app/api/sessions/route.ts` | session 管理 |
| `GET /api/skills` | `app/api/skills/route.ts` | 列出可用 skills |

**你的设计决策强烈影响后续实施路径**——见第 4 节决策空白。

### 3.4 推荐读 — Agent Steer 技术文档（~30 分钟）

[`design/docs/technical/agent-steer/index.md`](../agent-steer/index) — Agent Steer 是 Neo 已有的 AI Agent 产品，它的架构（extension + agent-server + browser-tool）是 Phase 3 的直接参考。

### 3.5 可选 — Neo 平台架构（~15 分钟）

- [`design/docs/technical/arch/arch-backend.md`](../arch/arch-backend) — 后端 FastAPI 分层规范
- [`design/docs/technical/arch/arch-frontend.md`](../arch/arch-frontend) — 前端 Next.js + shadcn 规范

---

## 4. 三个决策空白（动手前必须敲定）

### 决策 #1：LLM 接入方式 ⭐⭐⭐ **最关键**

| 选项 | 工作量 | 优 | 劣 |
|---|---|---|---|
| **A. 复用 neo-agents/agent-server** | 1-2 天 | 立即可用、避免重复、已有 models + sessions + skills 完整生态 | 跨服务调用（HTTP 跳一次）；不能直接 knlg DB 写 |
| **B. 自建 LLM Gateway** | 5-7 天 | 完全自控、低延迟 | 重复建设、与 agent-server 两套 LLM 配置 |
| **C. 抽公共 LLM 包** | 7-10 天 | 最干净 | 超 Phase 3 范围，需重构 agent-server |

**我的推荐**：选 **A**。理由：

- pi SDK 已支持多 provider（GPT-4 / Claude / Qwen 等）
- 模型配置 + 限流 + 降级都已就绪
- knlg-base 只做**业务编排**（访谈 Session / 追问决策 / 信号抽取），不重复造轮子

**04-llm-gateway.md 必须明确回答**：选哪个、API 契约长什么样、错误如何传递。

### 决策 #2：追问决策逻辑 ⭐⭐

| 选项 | 复杂度 | 适用 |
|---|---|---|
| A. 固定问题树 + 状态机（基于已有 KnlgQuestionTree）| 低 | MVP |
| B. LLM 动态生成追问 | 中 | v2 |
| C. 混合：模板控制主路径 + LLM 填补空白 | 高 | v3 |

**我的推荐**：选 **A → C 渐进**。

- Phase 3 MVP 先用 A：基于已有问题树模板（Phase 2 已实现）+ 简单条件判断（"上一条回答 < 10 字则追问"）
- v2 再叠加 LLM 动态生成
- 06-interview-agent.md 需要画出"决策树"（规则编排，不是 LLM 黑盒）

### 决策 #3：信号识别方式 ⭐⭐

| 选项 | 复杂度 | 标注方式 |
|---|---|---|
| A. LLM 实时抽取（每条 turn 都让 LLM 标信号类型）| 中 | 自动 + 可校 |
| B. 人工后置标注 | 低 | 人工 |
| C. 规则匹配（关键词/正则触发预定义信号）| 低 | 自动但粗 |

**我的推荐**：选 **A**。

- 用 SSE 流式返回**文字内容 + 信号标签**
- 信号标签 schema 需要你设计：`type`（痛点/商机/反例/边界）、`confidence`（0-1）、`linked_question_id`（关联到 knlg_question）
- 06-interview-agent.md 需要给出 Prompt 模板 + 解析逻辑

---

## 4.5 决策记录（2026-07-01 评审锁定）

> 本节是**项目负责人拍板**后的决策记录。设计人员在交付时**必须遵守**，不允许在后续设计中反转，除非开新的决策评审会。

| # | 决策 | 锁定值 | 理由 | 影响范围 |
|---|---|---|---|---|
| **D1** | Session 表设计 | **复用 `knlg_interview_session`，用 `mode` 字段区分**（不新增 `knlg_interview_ai_session`）| 数据集中、查询简化、避免双表 join | `06 §3.1 / §10 / §15.1` migration |
| **D2** | Last-Event-ID 持久化粒度 | **按 turn 粒度**（不按 event 粒度）| 减少 DB 写压力 4 倍（~56 vs ~240 次 / 访谈）| `06 §5.3 / §16 Q1 / §9.3 时序图` |
| **D3** | LiteLLM 版本策略 | **跟随 latest**（不锁版本）| Phase 3 快速迭代期受益社区修复 | `04 §4.1 / §4.3` |
| **D4** | 未来演进路径 | **暂不考虑与 agent-server 融合** | 业务模型不同，不需要保留迁移路径 | `04 §2.5`（删除 Option E 章节）|
| **D5** | PARE 信息不对称 | **Phase 3 MVP 暂不实施** | 复杂度高 + MVP 价值不显著；v2 评估 | `06 §3.3`（标记暂不实施，保留为 v2 参考）|

**决策变更流程**：

- 需要变更任何一个决策 → 项目负责人重开决策会
- 不允许设计师在交付时**默默反转**（除非 §4 三个原始决策空白重新讨论）

**原始决策空白 vs 锁定决策的映射**：

| §4 决策空白 | 锁定决策 | 备注 |
|---|---|---|
| #1 LLM 接入 | **不在锁定范围**（设计师自由选 A/B/D） | 设计师选了 D（Python 轻量客户端） |
| #2 追问决策 | **不在锁定范围**（设计师自由选 A/B/C） | 设计师选了 A（固定问题树 + 状态机） |
| #3 信号识别 | **不在锁定范围**（设计师自由选 A/B/C） | 设计师选了 A（LLM 实时抽取） |

设计师对 §4 三个原始决策的选择**记录在 [04 §2.1](./04-llm-gateway#21-三个候选方案对比) 与 [06 §6 / §7](./06-interview-agent)** 章节中，**不需要项目负责人批准**。

---

## 5. 06-interview-agent.md 必含设计项

这一份是 Phase 3 的核心，请重点保证以下内容完整：

### 5.1 数据库 Schema

```text
需要新增的表（建议）：
- knlg_interview_ai_session       # AI 访谈 session（含 expert_id, status, current_question_id）
- knlg_interview_ai_turn          # AI 访谈的 turn（含 prompt_version, signal_json）
- knlg_signal                     # 信号实体（type, confidence, source_turn_id）
- knlg_prompt_version             # Prompt 版本快照
```

**约束**：

- 沿用现有命名规范（`knlg_` 前缀、所有表带 `workspace_id` / `created_by` / `created_at` / `updated_at`）
- 参考 `01-database-schema.md` 的 ER 图规范

### 5.2 状态机

```text
AI 访谈 Session 生命周期（建议）：
draft → ai_probing → ai_summarizing → completed
                ↓
              paused (用户暂停)
                ↓
              abandoned (超时/放弃)
```

每个状态要有明确的进入条件和副作用。

### 5.3 SSE 协议

```text
前端通过 EventSource / fetch-stream 订阅：

事件类型（建议）：
- message_start    # AI 开始回答
- content_delta    # 流式文字片段
- signal_detected  # 检测到信号 {type, confidence, ...}
- question_proposed # AI 准备追问 {next_question_id, reason}
- message_end      # AI 回答结束
- error            # 错误
```

### 5.4 追问决策逻辑

给出**决策规则编排**示例（不是 LLM 黑盒）：

```python
if turn.answer_length < 10:
    ask_followup("能再详细说说吗？")
elif has_signal(turn, "痛点"):
    ask_followup("这个痛点有多严重？影响多少人？")
elif turn_count >= 5:
    move_to_summarizing()
else:
    next_question_from_tree()
```

### 5.5 前端流式 UI

参考 Phase 2 已有的 shadcn 组件模式：

- AI 消息气泡（流式打字效果）
- 信号高亮标签（点击展开详情）
- 追问原因解释面板
- "AI 正在思考..."loading 状态

---

## 6. 04-llm-gateway.md 必含设计项

### 6.1 架构图（必须画 mermaid）

```text
需要展示：
- knlg-base backend 与 agent-server 的关系
- agent-server 与 pi-coding-agent SDK 的关系
- pi SDK 与各 LLM Provider 的关系
- 限流/降级/缓存的位置
```

### 6.2 API 契约

```text
knlg-base → agent-server 的调用（建议）：

POST /api/agent/{agent_id}/new
  body: { system_prompt, user_message, model_id }
  → returns: { session_id, stream_url }

POST /api/agent/{agent_id}/message
  body: { session_id, message }
  → returns: SSE stream
```

### 6.3 错误码映射

```text
agent-server 错误 → knlg-base 错误码：
- provider_timeout → ERR_LLM_TIMEOUT (1004)
- rate_limited → ERR_LLM_RATE_LIMIT (1005)
- context_too_long → ERR_LLM_CONTEXT_OVERFLOW (1006)
- auth_failed → ERR_LLM_AUTH (1007)
```

---

## 7. 05-prompt-management.md 必含设计项

### 7.1 表用法

参考 `backend/src/app/models/knlg_llm_prompt.py` 现有 schema，文档化：

- 字段含义（name / content / version / variables / status）
- 如何创建新版本（创建 v2，v1 标 deprecated）
- 如何做 A/B（同一 name 不同 version 各 50% 流量）

### 7.2 编辑器 UI

- shadcn Textarea + JSON Schema 校验（变量声明）
- 版本对比（diff 视图）
- "试运行"按钮（输入测试变量，看渲染后 Prompt）
- A/B 流量配置

### 7.3 缓存策略

- Prompt 渲染结果 Redis 缓存（key: `prompt:{id}:{hash(variables)}`）
- TTL 5 分钟（变量变动立刻失效）
- 命中后跳过 LLM 的 system prompt 重新组装

---

## 8. 验证标准（你的设计需要满足）

### 8.1 文档质量

- [ ] 三个文档加起来 ≥ 1200 行
- [ ] 每个文档包含至少 1 个 mermaid 图（架构或流程）
- [ ] 每个 API 端点有：方法 + 路径 + 请求体 + 响应体 + 错误码
- [ ] 每个 DB 表有：字段表 + 索引 + 关联表外键
- [ ] 决策章节（决策 #1/#2/#3）给出**推荐 + 理由 + 风险 + 备选**

### 8.2 与已有规范一致

- [ ] 路径前缀沿用 `/api/v1/workspaces/{code}/knlg-base/...`
- [ ] 表名沿用 `knlg_` 前缀
- [ ] 状态字段沿用 `status`（draft/active/paused/completed 等统一字符串）
- [ ] 错误码沿用现有 `ERR_*` 体系（如需新增请明确列出）
- [ ] 前端组件沿用 shadcn/ui（不用 antd / MUI）

### 8.3 可实施性

- [ ] 04-llm-gateway.md 给出的 API 契约能直接生成 OpenAPI yaml
- [ ] 06-interview-agent.md 给出的 schema 能直接生成 alembic migration
- [ ] 06-interview-agent.md 给出的 SSE 事件类型能直接定义 zod schema

---

## 9. 排期建议（2-3 天）

| Day | 上午 | 下午 |
|---|---|---|
| **Day 1** | 读完第 3 节全部材料 + 敲定 3 个决策（开会 30 min）| 写 04-llm-gateway.md 草稿 |
| **Day 2** | 评审 04 + 写 05-prompt-management.md | 写 06-interview-agent.md 的 schema + 状态机 + SSE 协议 |
| **Day 3** | 写 06-interview-agent.md 的追问决策 + 前端 UI | 三个文档交叉 review + 修订 |

**关键里程碑**：

- Day 1 下午前必须完成：3 个决策敲定（不留到 Day 2）
- Day 2 下午前必须完成：06 schema 定稿（最复杂，影响所有后续工作）
- Day 3 下午前必须完成：交叉 review（避免单视角盲点）

---

## 10. 实施移交（设计完成后）

设计完成后，我会接手实施：

1. 创建 alembic migration（基于你的 schema）
2. 实现 backend service（基于你的 API 契约）
3. 实现 frontend SSE client + 流式 UI
4. 跑 e2e 测试

**给你的反馈通道**：设计稿写完后用 git commit + 在团队群里 @ 我，我会基于你的设计文档出 OpenSpec change（knlg-base-p3-llm-interview）。

---

## 11. 建议 Skills（给你用）

| Skill | 用途 | 何时调用 |
|---|---|---|
| `ast-grep` | 理解现有 knlg-base 代码模式 | 阅读 3 个 schema 模型时 |
| `lsp-navigation` | 在 backend 代码里跳转定义 | 写 04 / 05 时参考 service 层结构 |
| `openspec-new-change` | 设计完后生成 OpenSpec change | 全部设计完成 + 评审通过后 |
| `librarian` | 查 pi-coding-agent SDK 文档 | 写 04 时需要看 SDK 真实 API |
| `add-coding-exp` | 写实施总结时记录经验 | 实施完成后（非设计阶段）|
| `grill-me` | 自检决策合理性 | 三个决策敲定前 |
| `grill-with-docs` | 检查术语与已有文档一致 | 写作过程中随时 |

---

## 12. 关键参考文档（路径清单）

```
必读：
  design/docs/technical/knlg-base/index.md
  design/docs/technical/knlg-base/01-database-schema.md
  design/docs/technical/knlg-base/02-backend-api.md
  design/docs/technical/knlg-base/03-frontend-modules.md
  backend/src/app/models/knlg_llm_model.py
  backend/src/app/models/knlg_llm_prompt.py
  backend/src/app/models/knlg_llm_provider.py

复用资产：
  /Volumes/data/working/ai/neo-agents/agent-server/app/api/models/route.ts
  /Volumes/data/working/ai/neo-agents/agent-server/app/api/agent/[id]/new/route.ts
  /Volumes/data/working/ai/neo-agents/agent-server/app/api/sessions/route.ts

上下文：
  design/docs/product/knlg-base/q-a-library.md
  design/docs/product/knlg-base/implementation-roadmap.md (Phase 3 部分)
  design/docs/technical/agent-steer/index.md (参考 Agent 架构)

平台规范：
  design/docs/technical/arch/arch-backend.md
  design/docs/technical/arch/arch-frontend.md
```

---

## 13. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 3 个决策敲不定，开始写文档 | 设计稿反复返工 | Day 1 上午开 30 min 决策会，必须有结论 |
| 06-interview-agent 状态机过于复杂 | schema 设计难产 | 借鉴 Phase 1 已有知识卡状态机（draft→published→deprecated）|
| LLM 成本失控 | 月度预算超支 | 04 必须给出限流 + 降级策略（每个 user 每小时 100 次上限）|
| 实时 SSE 在前端断流 | AI 访谈体验差 | 06 必须设计重连机制（Last-Event-ID）|
| agent-server 跨服务调用延迟 | 实时性差 | 评估是同进程嵌入 agent-server 还是 HTTP 调用 |

---

## 14. 验收 Checklist（你自己用）

写完后自查：

- [ ] 我读完了第 3 节全部必读材料
- [ ] 我和 PM 敲定了 3 个决策（决策 #1/#2/#3）
- [ ] 04-llm-gateway.md 给出**架构图 + API 契约 + 限流降级 + 错误码**
- [ ] 05-prompt-management.md 给出**表用法 + 版本控制 + A/B + 编辑器 UI + 缓存**
- [ ] 06-interview-agent.md 给出**schema + 状态机 + SSE 协议 + 追问决策 + 前端 UI**
- [ ] 三个文档路径、命名、错误码与已有规范一致
- [ ] 每个文档 ≥ 400 行（深度足够，不是空话）
- [ ] 每个决策有推荐 + 理由 + 风险 + 备选（不是单选）
- [ ] git commit + 在群里 @ 我

---

## 🔗 相关文档

- [知识库与问答库技术设计总览](./index)
- [Phase 1 数据库 schema](./01-database-schema)
- [Phase 1 后端 API](./02-backend-api)
- [Phase 1 前端模块](./03-frontend-modules)
- [实施路线图 Phase 3 章节](../../product/knlg-base/implementation-roadmap)
- [Agent Steer 技术总览](../agent-steer/index)（参考架构）

---

> **致接手的设计人员**：本文档目标是让你 2-3 天高效交付，不留歧义。如发现决策空白或新约束，请直接修改本文档并在群里同步。设计阶段的问题越早暴露，返工成本越低。
