# Proposal: knlg-base Phase 3 — LLM Gateway + AI 访谈 Agent

## Why

Phase 1 + Phase 2 已完成 knlg-base 的数据模型 + 问答库 MVP（19 张表 + 58 endpoint + 中文 FULLTEXT 检索 + 数据看板），但访谈完全靠产品经理手敲问题，覆盖面窄、效率低。Phase 3 让 AI 主动发起访谈、动态追问、自动标注信号，让知识提炼从"被动录入"升级为"主动萃取"，是知识卡生成（Phase 4）的必由前置。

## What Changes

- **新增 LLM Gateway 服务**（Option D：Python 轻量客户端 + LiteLLM），封装多 provider 调用、流式 SSE、限流降级、可观测
- **新增 AI 访谈 Session 能力**，复用 Phase 1 `knlg_interview_session` 表（用 `mode='ai_agent'` 字段），支持 6 态状态机 + SSE 流式对话
- **新增追问决策器**（Option A：固定问题树 + 状态机 + 简单条件），v2 再叠 LLM 动态生成
- **新增信号识别服务**（Option A：LLM 实时抽取 + Pydantic 强约束），用 SSE 流式返回文字 + 信号标签
- **新增 Prompt 模板管理**，支持 KnlgLlmPrompt 表 + 版本控制 + Jinja2 渲染 + Redis 缓存 + Monaco 编辑器
- **修改 qa-library 能力**：扩展 `knlg_interview_session` 表，加 AI 专属列（`tree_id` / `current_turn_index` / `max_turns` / `last_event_id` / `waiting_reason` / `started_at` / `ended_at` / `summary`）；`status` 扩展为 6 态 enum
- **新增 3 张表**：`knlg_interview_ai_turn`（AI turn + tokens + cost + FULLTEXT）、`knlg_signal`（信号实体）、`knlg_prompt_version_snapshot`（Prompt 追溯）
- **新增前端 AI 访谈实时对话页**，基于 shadcn 流式 UI + EventSource Hook + Zustand signal store

设计决策锁定（2026-07-01 评审，详见 [PHASE3-DESIGN-HANDOFF §4.5](../../../../design/docs/technical/knlg-base/PHASE3-DESIGN-HANDOFF#45-决策记录2026-07-01-评审锁定)）：

| # | 决策 | 锁定值 |
|---|---|---|
| D1 | Session 表设计 | 复用 `knlg_interview_session` + `mode` 字段（不新增 `knlg_interview_ai_session`）|
| D2 | Last-Event-ID 持久化粒度 | 按 turn 粒度 |
| D3 | LiteLLM 版本策略 | 跟随 latest |
| D4 | 与 agent-server 融合 | 暂不考虑 |
| D5 | PARE 信息不对称 | Phase 3 MVP 暂不实施 |

## Capabilities

### New Capabilities

- `llm-gateway`：LiteLLM 封装的 Python 轻量 LLM 客户端，支持多 provider / 流式 SSE / 限流降级 / 调用日志审计
- `ai-interview-agent`：AI 主动访谈能力，6 态状态机 + 追问决策器 + 信号识别 + SSE 协议 + Last-Event-ID 重连
- `prompt-management`：Prompt 模板管理（KnlgLlmPrompt 表 + 版本控制 + Jinja2 渲染 + Redis 缓存 + Monaco 编辑器）

### Modified Capabilities

- `qa-library`：扩展 Session 表（mode 字段扩展 + 8 个 AI 专属列 + `idx_session_mode_status` 索引），AI turn 与 Phase 1 turn 双写
- `knowledge-base`（间接影响）：Phase 4 知识卡片生成的 source_ref 链路现在也包含 AI turn

## Impact

### 后端

- 新增 `backend/src/app/services/knlg_base/llm/`（client / router / cost_guard / logger / exceptions / types）
- 新增 `backend/src/app/services/knlg_base/agent/`（service / state_machine / followup_decider / signal_extractor / summarizer / stream）
- 扩展 `backend/src/app/api/v1/knlg_base/qa.py` + `knowledge.py`
- 新增 1 个 alembic migration：`2026_07_xx_005_phase3_ai_interview.sql`
- 新增依赖：`litellm` (~3MB)、`jinja2`、`httpx`（LiteLLM 已传递依赖）

### 前端

- 新增 `frontend/app/(main)/workspace/[workspace_code]/knlg-base/qa/interview/ai/`（AI 访谈实时对话页）
- 新增 `frontend/app/(main)/workspace/[workspace_code]/knlg-base/prompts/`（Prompt 编辑器）
- 新增 `frontend/components/knlg-base/ai/`（流式 UI + signal chip + 追问原因面板）
- 新增 `frontend/lib/api/knlg-base/llm.ts`（LLM API client）
- 新增 `frontend/lib/stores/signal-store.ts`（Zustand）

### 数据库

- 1 个 alembic migration（含 ALTER TABLE + 3 张新表）
- 预估 +250 行 DDL + indexes

### 依赖

- Python: `litellm`（latest，决策 D3）、`jinja2`、`httpx`
- 前端: 无新增第三方依赖（沿用 zustand + shadcn）

### 性能预算

- 单访谈 SSE 事件持久化：~56 次 DB 写（turn 粒度，决策 D2）
- 限流：单 user ≤ 100 次/小时（Redis INCR + EXPIRE）
- 监控：100% 请求落 `knlg_interview_ai_turn.llm_request_log` JSON

### 风险

- LiteLLM latest 偶发 breaking change → CI 跑通即升级（决策 D3）
- AI 访谈超时未关 → 定时任务扫描 `waiting_for_context` 状态 + 5 分钟阈值
- Prompt 模板注入攻击 → Jinja2 sandbox + 变量白名单

---

**详细技术方案**：参见 [technical/knlg-base/04-llm-gateway.md](../../../../design/docs/technical/knlg-base/04-llm-gateway) / [05-prompt-management.md](../../../../design/docs/technical/knlg-base/05-prompt-management) / [06-interview-agent.md](../../../../design/docs/technical/knlg-base/06-interview-agent)。
