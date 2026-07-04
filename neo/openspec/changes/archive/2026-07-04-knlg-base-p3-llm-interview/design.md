# Design: knlg-base-p3-llm-interview

## Context

Phase 1（19 张表 + 58 endpoint + 18 页面 + 状态机）和 Phase 2（问题树模板 + ngram FULLTEXT 中文检索 + 数据看板 + bulk 导入导出）已全部交付。当前 knlg-base 仅支持**手工录入**访谈，依赖产品经理手敲问题 + 专家被动回答，覆盖面窄 + 效率低，无法支撑 Phase 4 知识卡片自动萃取。

Phase 3 引入 AI 主动访谈 Agent，让 AI 代替产品经理发起访谈、根据回答动态追问、自动标注信号。3 个新的技术设计文档已交付（[04-llm-gateway.md](../../../design/docs/technical/knlg-base/04-llm-gateway) / [05-prompt-management.md](../../../design/docs/technical/knlg-base/05-prompt-management) / [06-interview-agent.md](../../../design/docs/technical/knlg-base/06-interview-agent)，共 3474 行）。本文档聚焦架构总览 + 关键决策 + 风险 + 实施路径，详细实现细节参见上述 3 个设计文档。

## Goals / Non-Goals

### Goals

- ✅ **AI 主动访谈**：AI 发起访谈、动态追问、信号识别、自动总结
- ✅ **SSE 流式实时对话**：首 token 延迟 < 2 秒，断线可重连
- ✅ **多 provider LLM 接入**：OpenAI / Anthropic / 国内模型，至少 2 个可切换
- ✅ **限流 + 降级 + 可观测**：100% 调用落日志，限流 100 次/user/小时，自动 fallback
- ✅ **Prompt 可管理**：产品可调、可版本、可 A/B（Phase 3 默认 disabled）
- ✅ **状态机 + 双写**：AI turn 与 Phase 1 turn 双写，Phase 4 知识卡片可直接消费

### Non-Goals

- ❌ **PARE 信息不对称**（Phase 3 MVP 不实施，v2 评估）
- ❌ **embedding / 向量检索**（Phase 1 FULLTEXT 已足够，v2 评估）
- ❌ **多 Agent 协作**（单 Agent 访谈 MVP，多 Agent v3 评估）
- ❌ **跨 workspace Prompt 市场**（单 workspace 足够）
- ❌ **与 agent-server 融合**（业务模型不同，不预留迁移路径，决策 D4）

## Decisions

### 决策 D-1：LLM Gateway 选 Option D（Python 轻量客户端 + LiteLLM）

**Why**：复用 agent-server 存在 6 个硬冲突（cwd 必填 / Session 文件系统绑定 / 14 个工具过重 / 8 个命令过宽 / `userId=0` 占位 / 10 分钟 session 自动 destroy），强行复用需要写翻译层 > 自建客户端。LiteLLM 内置 ~100 provider 抽象，统一 SSE/错误/重试/Token 计数，2-3 天可上线。

**Alternatives**：

- Option A 复用 agent-server（1-2 天，但需要 30+ 天的翻译层维护）
- Option B 自建完整 Gateway（5-7 天，过度设计）
- **Option D Python 轻量客户端 + LiteLLM（2-3 天）← 选定**

详见 [04-llm-gateway.md §2 决策论证](../../../design/docs/technical/knlg-base/04-llm-gateway#2-决策论证为何选-option-dpython-轻量客户端)。

### 决策 D-2：追问决策 = Option A（固定问题树 + 状态机）

**Why**：MVP 阶段用基于已有 KnlgQuestionTree 的规则决策（10 种 `next_question_reason`）已能覆盖 80% 场景；LLM 动态生成追问是 v2 候选（决策锁定）。状态机可枚举、可测试、可追溯。

**Alternatives**：

- A 固定问题树 + 状态机（Phase 3 选定）
- B LLM 动态生成追问（v2）
- C 混合（v3）

详见 [06-interview-agent.md §6 追问决策逻辑](../../../design/docs/technical/knlg-base/06-interview-agent#6-追问决策逻辑决策-2--option-a)。

### 决策 D-3：信号识别 = Option A（LLM 实时抽取 + Pydantic 强约束）

**Why**：LLM 实时抽取精度（>0.8 confidence）远高于规则匹配；Pydantic schema 强约束确保 5 类信号（pain_point / opportunity / counter_example / boundary / key_metric）结构化输出。SSE 流式返回文字 + 信号标签，前端实时高亮。

详见 [06-interview-agent.md §7 信号识别](../../../design/docs/technical/knlg-base/06-interview-agent#7-信号识别决策-3--option-a)。

### 决策 D-4：Session 表用 `mode` 字段扩展（不分设两张 session 表）

**Why**：避免双表 join、简化查询、单一事实源。AI 专属列（`tree_id` / `current_turn_index` / `max_turns` / `last_event_id` / `waiting_reason` / `started_at` / `ended_at` / `summary`）通过 migration 加到 Phase 1 表。

**Alternatives**：

- 新增 `knlg_interview_ai_session` 表（被否决：双表 join 成本、Phase 4 消费复杂）
- **扩展 Phase 1 表（选定）**

详见 [06-interview-agent.md §3.1.1 + §10](../../../design/docs/technical/knlg-base/06-interview-agent#3-数据库新表设计)。

### 决策 D-5：Last-Event-ID 按 turn 粒度持久化（不按 event）

**Why**：长访谈 × 多 event × 高并发会导致 DB 写压力过大。按 turn 粒度（`turn_completed` / `message_end` / `session_state_changed` / `signal_detected` / `question_proposed` / `summary_ready` / `error`）写 DB，~56 次/访谈 vs ~240 次（4 倍下降）。

详见 [06-interview-agent.md §5.3](../../../design/docs/technical/knlg-base/06-interview-agent#53-last-event-id-协议断线重连按-turn-粒度)。

### 决策 D-6：LiteLLM 跟随 latest（不锁版本）

**Why**：Phase 3 快速迭代期受益社区修复；锁版本反而带来升级摩擦。主要风险（breaking change）通过 CI 跑 e2e 测试覆盖。

详见 [04-llm-gateway.md §4.3 版本策略](../../../design/docs/technical/knlg-base/04-llm-gateway#43-版本策略--备选方案)。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16)                                       │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │ /qa/interview/ai/      │  │ /prompts (Monaco 编辑器)  │  │
│  │ (SSE 流式对话页)       │  │                          │  │
│  └────────────┬───────────┘  └─────────────┬────────────┘  │
│               │                             │              │
│               │ EventSource + knlgGet       │              │
└───────────────┼─────────────────────────────┼──────────────┘
                │                             │
                ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│  knlg-base Backend (FastAPI)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ interview/   │  │ prompts/     │  │ stats/ (Phase 2) │ │
│  │ ai/ router   │  │ router       │  │                  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘ │
│         │                 │                                │
│  ┌──────┴─────────────────┴──────────────────────────┐   │
│  │ Services:                                           │   │
│  │  - KnlgInterviewAgentService                       │   │
│  │    (state machine + SSE stream + 双写)            │   │
│  │  - KnlgFollowupDecider (10 种 next_question_reason)│   │
│  │  - KnlgSignalExtractor (LLM 实时抽取)             │   │
│  │  - KnlgPromptRenderer (Jinja2 + Redis cache)       │   │
│  │  - KnlgLlmCostGuard (限流 100/h)                  │   │
│  │  - KnlgLlmLogger (100% 调用审计)                  │   │
│  └──────┬─────────────────────────────────────────────┘   │
│         │                                                   │
│  ┌──────┴──────────┐    ┌──────────────────────────────┐ │
│  │ KnlgLlmClient   │    │ MySQL                         │ │
│  │ (LiteLLM 封装)  │    │  - knlg_llm_provider/model/  │ │
│  └──────┬──────────┘    │    prompt (Phase 1 schema)    │ │
│         │              │  - knlg_interview_session     │ │
│         │              │    (Phase 3 加 8 列)          │ │
│         │              │  - knlg_interview_ai_turn    │ │
│         │              │    (Phase 3 新表)             │ │
│         │              │  - knlg_signal (新表)         │ │
│         │              │  - knlg_prompt_version_      │ │
│         │              │    snapshot (新表)            │ │
│         │              └──────────────────────────────┘ │
│         │                                                   │
└─────────┼─────────────────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────┐
   │ LiteLLM (100+ providers)               │
   │  - OpenAI / Anthropic / Qwen / Others  │
   └─────────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────┐
   │ LLM Provider APIs                       │
   └─────────────────────────────────────────┘
```

完整架构 + 时序图见 [04-llm-gateway.md §3](../../../design/docs/technical/knlg-base/04-llm-gateway#3-架构) + [06-interview-agent.md §3 + §9.3](../../../design/docs/technical/knlg-base/06-interview-agent)。

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| **LiteLLM breaking change** | 调用突然失败 | CI 跑 e2e 测试（决策 D-6），失败即 revert |
| **AI 访谈超时未关** | 资源泄漏 + 数据库脏数据 | 定时任务扫描 `waiting_for_context` > 5min → abandon |
| **Prompt 注入攻击** | 提示词被恶意覆盖 | Jinja2 sandbox + 变量白名单（[05 §4.2](../../../design/docs/technical/knlg-base/05-prompt-management#42-渲染实现)） |
| **API Key 泄露** | 外部攻击者盗用 LLM 额度 | Fernet 加密存储（spec llm-gateway §"API Key 加密存储"） |
| **信号抽取幻觉** | 错信号污染知识库 | confidence 字段（>0.8 才高亮），人工校对接 Phase 4 |
| **SSE 断线体验差** | AI 访谈卡顿 | Last-Event-ID 重连（turn 粒度，决策 D-5） |
| **跨 workspace 误读** | 数据隔离失效 | 现有 `workspace_id` 过滤（Phase 1）+ AI service 复用 |
| **真实成本失控** | 月度 LLM 预算超支 | 限流 100 次/user/小时（spec llm-gateway）+ 后续成本仪表盘（Phase 4+）|

## Migration Plan

### Phase 1: Database migration（半小时）

1. alembic upgrade：`2026_07_xx_005_phase3_ai_interview.sql`
   - ALTER `knlg_interview_session` ADD 8 列 + 2 索引
   - CREATE 3 张新表（`knlg_interview_ai_turn` / `knlg_signal` / `knlg_prompt_version_snapshot`）

### Phase 2: 后端服务（2-3 天）

1. `backend/src/app/services/knlg_base/llm/`（6 个模块）
   - `client.py` - KnlgLlmClient（LiteLLM 封装）
   - `router.py` - provider/model 选择 + fallback
   - `cost_guard.py` - Redis 限流
   - `logger.py` - 调用审计
   - `exceptions.py` / `types.py`

2. `backend/src/app/services/knlg_base/agent/`（8 个模块）
   - `service.py` - KnlgInterviewAgentService 主入口
   - `state_machine.py` - 6 态状态机
   - `followup_decider.py` - 10 种 next_question_reason
   - `signal_extractor.py` - LLM 实时信号抽取
   - `summarizer.py` - AI 总结
   - `stream.py` - SSE 流编排
   - `session_repo.py` / `turn_repo.py` / `signal_repo.py`

3. 扩展 `backend/src/app/api/v1/knlg_base/qa.py`
   - 新增 `/interview/ai/sessions` 端点
   - 新增 `/interview/ai/sessions/{id}/stream` SSE 端点
   - 新增 `/qa/stats/summary`（已有，Phase 2）

### Phase 3: 前端 UI（2-3 天）

1. `frontend/app/(main)/workspace/[workspace_code]/knlg-base/qa/interview/ai/`（AI 访谈实时对话页）
2. `frontend/app/(main)/workspace/[workspace_code]/knlg-base/prompts/`（Prompt 编辑器）
3. `frontend/components/knlg-base/ai/`（流式 UI + signal chip + 追问原因面板）
4. `frontend/lib/api/knlg-base/llm.ts` + `frontend/lib/stores/signal-store.ts`

### Phase 4: 集成测试（1 天）

- 单元测试：state machine / followup_decider / signal_extractor / prompt_renderer
- 集成测试：mock LLM 跑完整 turn 流程
- E2E：真实 LLM（gpt-4o-mini）跑 5 个 persona × 完整访谈

### Rollback Strategy

- **数据库**：alembic downgrade 可逆（drop 新表 + drop 新列）
- **后端**：删除 `services/knlg_base/llm/` 和 `services/knlg_base/agent/` 即可
- **前端**：删除 `app/.../interview/ai/` 和 `app/.../prompts/` 即可
- **feature flag**：建议加 `KNLG_AI_INTERVIEW_ENABLED` env，默认 true，紧急关闭

## Open Questions

| # | 问题 | 影响 | 建议 |
|---|---|---|---|
| OQ1 | LiteLLM 升级是否需要灰度？| 风险/上线节奏 | Phase 3 先单环境快速升级，Phase 4 加灰度 |
| OQ2 | AI session 是否需要 cron 自动清理 30 天前的 `abandoned`？| DB 大小 | v2 评估 |
| OQ3 | 信号是否需要"撤回"操作（专家觉得不对）| UX | v2 评估 |
| OQ4 | 追问深度限制是硬限制还是软建议？| 访谈时长控制 | 硬限制（max_turns=8），避免专家疲劳 |

## Implementation Timeline

```
W8  Day 1-2: 后端 llm/ + agent/ services (8 modules)
W8  Day 3:   alembic migration + 端点 + 集成测试
W8  Day 4-5: 前端 AI 访谈实时对话页 + Prompt 编辑器
W9  Day 1:   单元测试 (state machine / decider / extractor)
W9  Day 2:   集成测试 (mock LLM)
W9  Day 3:   E2E 测试 (5 personas × gpt-4o-mini)
W9  Day 4-5: Bug bash + 文档收尾
```

总工作量：约 **8-10 天**（与 implementation-roadmap.md Phase 3 W8-W10 估算一致）。

## Cross-References

- **Proposal**: [./proposal.md](./proposal.md)
- **Specs**: [./specs/llm-gateway/](./specs/llm-gateway) / [./specs/ai-interview-agent/](./specs/ai-interview-agent) / [./specs/prompt-management/](./specs/prompt-management) / [./specs/qa-library/](./specs/qa-library) (delta)
- **设计文档（详细）**:
  - [04-llm-gateway.md](../../../design/docs/technical/knlg-base/04-llm-gateway) — LLM 客户端 + LiteLLM 集成
  - [05-prompt-management.md](../../../design/docs/technical/knlg-base/05-prompt-management) — Prompt 模板 + 版本控制 + A/B
  - [06-interview-agent.md](../../../design/docs/technical/knlg-base/06-interview-agent) — AI 访谈 Agent 状态机 + SSE + 信号识别
- **决策记录**: [PHASE3-DESIGN-HANDOFF §4.5](../../../design/docs/technical/knlg-base/PHASE3-DESIGN-HANDOFF#45-决策记录2026-07-01-评审锁定)
- **实施路线图**: [implementation-roadmap.md §3 Phase 3](../../../design/docs/technical/knlg-base/implementation-roadmap)
