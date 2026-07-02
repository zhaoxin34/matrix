# Spec: ai-interview-agent

## Purpose

定义 AI 主动访谈 Agent 能力：6 态状态机 + 追问决策器 + 信号识别 + SSE 协议 + Last-Event-ID 重连。基于 Phase 1 `knlg_interview_session` 表扩展（mode='ai_agent'），新增 3 张表（`knlg_interview_ai_turn` / `knlg_signal` / `knlg_prompt_version_snapshot`）。

## ADDED Requirements

### Requirement: AI 访谈 Session 状态机

The system SHALL implement a 6-state finite state machine for AI interview sessions:

```
draft → ai_probing → ai_summarizing → completed
                ↓
       waiting_for_context (5 分钟超时 → abandoned)
                ↓
       paused (人工) / abandoned (超时)
```

状态转移白名单 + 副作用：

| From | To | 触发 | 副作用 |
|---|---|---|---|
| draft | ai_probing | `start_session()` | 写 `started_at` |
| ai_probing | ai_summarizing | `decide()` 返回 SUMMARIZE | 触发 AI 总结 |
| ai_probing | waiting_for_context | `decide()` 返回 WAIT_EXPERT | 写 `waiting_reason` |
| waiting_for_context | ai_probing | 外部事件 / 人工 resume | 清 `waiting_reason` |
| ai_summarizing | completed | AI 总结完成 | 写 `summary` + `ended_at` |
| any | paused | 人工 `pause()` | 保留 SSE 连接 |
| any | abandoned | 超时 / 人工 `abandon()` | 关闭 SSE |

#### Scenario: 启动 session

- **WHEN** 客户端调用 `POST /interview/ai/sessions` with `mode='ai_agent'`
- **THEN** 创建 session（status=draft），返回 SSE stream URL

#### Scenario: 正常完成

- **WHEN** AI 决定 SUMMARIZE（基于 max_turns 或 followup_decider）
- **THEN** 状态转 `ai_summarizing` → AI 总结 → 状态转 `completed` + 关闭 SSE

#### Scenario: 超时自动 abandon

- **WHEN** session 处于 `waiting_for_context` 超过 5 分钟
- **THEN** 定时任务标记 `abandoned` + 关闭 SSE

### Requirement: SSE 协议（11 事件类型）

The system SHALL emit SSE events in the following 11 types via the `/interview/ai/sessions/{id}/stream` endpoint:

| 事件 | 触发时机 | 客户端处理 |
|---|---|---|
| `connected` | SSE 连接建立 | 记录 `lastEventId` |
| `message_start` | AI 消息开始 | 显示"AI 正在思考..." |
| `content_delta` | 流式 chunk | 追加到气泡 |
| `signal_detected` | 检测到信号 | 高亮 + 入 store |
| `question_proposed` | AI 准备追问 | 替换问题 + 显示原因 |
| `message_end` | 一条消息结束 | 隐藏"thinking" |
| `session_state_changed` | 状态机转移 | 更新状态指示器 |
| `turn_completed` | 一轮 turn 完成 | 进度条更新 |
| `summary_ready` | 总结完成 | 跳到结果页 |
| `error` | 错误 | 重连或中止 |
| `done` | SSE 流结束 | 关闭 EventSource |

#### Scenario: 流式 content_delta

- **WHEN** LLM 返回 chunk `{"delta": "您好"}`
- **THEN** SSE emit `event: content_delta\ndata: {"turnIndex": 1, "delta": "您好"}\n\n`

#### Scenario: turn_completed 持久化 last_event_id

- **WHEN** turn 完成 + 状态持久化
- **THEN** `knlg_interview_session.last_event_id` 更新为 `evt_{session_id}_{turn_index}_{seq}`（turn 粒度，非 event 粒度）

### Requirement: Last-Event-ID 重连协议

The system SHALL support SSE resume via `Last-Event-ID` HTTP header. On reconnect, server replays all events from `last_event_id` onwards. **Persistence is per-turn** (decision D2), not per-event — only `turn_completed` / `message_end` / `session_state_changed` / `signal_detected` / `question_proposed` / `summary_ready` / `error` events are persisted.

#### Scenario: 断线重连

- **WHEN** 客户端断线后用 `Last-Event-ID: evt_1_2_5` 重连
- **THEN** 服务端从 `evt_1_2_5` 之后推送该 turn 的剩余 events

#### Scenario: 重连性能预算

- **WHEN** 长访谈 ~8 turn × ~7 持久化事件
- **THEN** 总 DB 写 ~56 次（vs event 粒度的 ~240 次，4 倍下降）

### Requirement: 追问决策器（10 种 reason）

The system SHALL implement a follow-up decision engine that emits one of 10 `next_question_reason` codes:

| Reason | 触发条件 |
|---|---|
| `TREE_NEXT` | 问题树当前节点答完，进入下一节点 |
| `TREE_FOLLOWUP` | 当前节点有 followup 子节点 |
| `TOO_SHORT` | 专家回答 < 10 字符 |
| `TOO_VAGUE` | 回答缺少关键名词/动词（启发式） |
| `MISSING_EXAMPLE` | 涉及流程但无具体例子 |
| `MISSING_METRIC` | 涉及效果但无数字 |
| `HIGH_SIGNAL` | 检测到高 confidence 信号（> 0.8） |
| `LOW_SIGNAL` | 全程低信号（confidence < 0.3） |
| `MAX_TURNS_REACHED` | 达到 max_turns 上限 |
| `EXPERT_REQUEST_PAUSE` | 专家主动请求暂停 |

#### Scenario: 回答太短触发追问

- **WHEN** 专家回答长度 < 10 字符
- **THEN** 决策器返回 `TOO_SHORT`，AI 追问"能再详细说说吗？"

#### Scenario: 检测到高信号

- **WHEN** 信号 confidence > 0.8
- **THEN** 决策器返回 `HIGH_SIGNAL`，AI 追问"这个痛点有多严重？影响多少人？"

### Requirement: 信号识别（5 类 + Pydantic 强约束）

The system SHALL extract signals from expert answers using LLM, with Pydantic-validated output:

| Type | 含义 |
|---|---|
| `pain_point` | 痛点 / 抱怨 |
| `opportunity` | 商机 / 增长机会 |
| `counter_example` | 反例 / 边界条件 |
| `boundary` | 适用边界 |
| `key_metric` | 关键指标 / 数字 |

每个信号含 `confidence` (0-1) + `text` + `linked_question_id`（关联到 knlg_question，可选）。

#### Scenario: 信号抽取

- **WHEN** AI 处理专家回答"客户最讨厌我们响应慢，3天才回邮件"
- **THEN** 抽取信号 `{type: "pain_point", confidence: 0.92, text: "响应慢 3 天回邮件", linked_question_id: null}`

#### Scenario: 信号写 DB + SSE 推送

- **WHEN** 信号被识别
- **THEN** INSERT `knlg_signal` 表 + SSE emit `signal_detected` event

### Requirement: 总结阶段（ai_summarizing）

The system SHALL generate an AI summary when session enters `ai_summarizing` state, using a separate `interview_summarize` Prompt template. Summary contains: `key_findings` (list) / `suggested_kc_count` (int) / `signal_count` (int) / `full_text` (string).

#### Scenario: 总结完成

- **WHEN** AI 总结完成
- **THEN** UPDATE `knlg_interview_session SET summary=?, status='completed', ended_at=NOW()` + SSE emit `summary_ready`

### Requirement: Turn 双写（AI turn + Phase 1 turn）

The system SHALL write to BOTH `knlg_interview_ai_turn` AND `knlg_interview_turn` (Phase 1) in a single transaction for each AI turn, so that Phase 4 knowledge card generation can consume Phase 1 turn via SourceRef.

#### Scenario: 双写成功

- **WHEN** 一个 AI turn 完成
- **THEN** 同一事务 INSERT 两张表（AI turn 含 tokens/cost/Prompt version；Phase 1 turn 含 sequence/question/answer）

#### Scenario: 双写回滚

- **WHEN** AI turn INSERT 失败
- **THEN** Phase 1 turn 也回滚（同一事务）

### Requirement: Session 表扩展（Phase 1 表加列）

The system SHALL extend `knlg_interview_session` table with AI-specific columns via alembic migration:

| 新增列 | 类型 | 说明 |
|---|---|---|
| `tree_id` | BIGINT NULL | 引导问题树（NULL = 无模板自由访谈） |
| `waiting_reason` | VARCHAR(255) NULL | waiting_for_context 原因 |
| `current_turn_index` | INT NOT NULL DEFAULT 0 | 当前 turn 序号 |
| `max_turns` | INT NOT NULL DEFAULT 8 | 防失控上限 |
| `last_event_id` | VARCHAR(64) NULL | SSE 断线重连 |
| `started_at` | DATETIME NULL | 开始时间 |
| `ended_at` | DATETIME NULL | 结束时间 |
| `summary` | TEXT NULL | AI 自动总结 |

`mode` 字段扩展为 `manual` / `ai_agent`；`status` 字段扩展为 9 态（4 个手工 + 5 个 AI）。

#### Scenario: 单表查询所有访谈

- **WHEN** `SELECT * FROM knlg_interview_session WHERE workspace_id=?`
- **THEN** 返回该 workspace 所有访谈（manual + ai_agent），无需 join 第二张 session 表

### Requirement: PARE 信息不对称（v2 评估）

The system SHALL NOT implement PARE information asymmetry in Phase 3 MVP. Expert and AI share the same observation space (all turns + signals visible to both). v2 to evaluate based on real interview feedback.

## Dependencies

- 依赖 [llm-gateway](./llm-gateway) 能力（LiteLLM 客户端）
- 依赖 [prompt-management](./prompt-management) 能力（Prompt 渲染）
- 依赖 `knlg_question_tree`（Phase 1/2 已有）
- 依赖 Redis（rate limit + prompt cache）

## Cross-References

- 设计文档: [06-interview-agent.md](../../../../design/docs/technical/knlg-base/06-interview-agent)
- Handoff: [PHASE3-DESIGN-HANDOFF §4.5 决策记录](../../../../design/docs/technical/knlg-base/PHASE3-DESIGN-HANDOFF#45-决策记录2026-07-01-评审锁定)
