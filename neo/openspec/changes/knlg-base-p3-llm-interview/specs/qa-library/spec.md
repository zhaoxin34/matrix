# qa-library (Phase 3 Delta)

## Purpose

Phase 3 修改 `qa-library` 能力的**有限部分**：扩展 `knlg_interview_session` 表的 `mode` 字段允许 `ai_agent` 模式，并在 `qa-library` 命名空间下新增 AI 访谈相关的辅助端点（不影响手工访谈路径）。

完整 AI 访谈 Agent 能力（状态机 / SSE / 追问决策 / 信号识别）定义在 [ai-interview-agent spec](../ai-interview-agent/spec.md)。本 delta 只覆盖 qa-library 表层 + Schema 改动。

## MODIFIED Requirements

### Requirement: Interview Session CRUD

The system SHALL provide CRUD operations for interview sessions (`knlg_interview_session`). A session is a unit that groups multiple interviews with the same expert on a topic. **Phase 3 adds `mode='ai_agent'` support** alongside the existing `mode='manual'`. AI agent-driven sessions use the same table with extended schema (8 new columns added via migration).

#### Scenario: Create interview session (manual mode, unchanged)

- **WHEN** an authenticated user with `member` or higher role posts to `POST /api/v1/workspaces/W/knlg-base/qa/sessions` with `mode='manual'`
- **THEN** the system MUST persist a row in `knlg_interview_session` with `workspace_id = W.id`, `expert_id`, `topic`, `mode = 'manual'`, `started_at = NOW()`

#### Scenario: Create interview session (ai_agent mode, NEW)

- **WHEN** an authenticated user with `member` or higher role posts to `POST /api/v1/workspaces/W/knlg-base/qa/sessions` with `mode='ai_agent'`
- **THEN** the system MUST persist a row in `knlg_interview_session` with `mode = 'ai_agent'`, `status = 'draft'`, `current_turn_index = 0`, `max_turns = 8` (default), `started_at = NOW()`
- **AND** the system MUST accept optional `tree_id` (引导问题树，FK to `knlg_question_tree`)

#### Scenario: Reject ai_agent mode in P0 (REMOVED in Phase 3)

> **Removed in Phase 3**: The P0 restriction "Reject ai_agent mode" is no longer in effect. AI agent mode is now supported.

#### Scenario: Update interview session

- **WHEN** an authenticated user with `member` or higher role updates `PUT /api/v1/workspaces/W/knlg-base/qa/sessions/{id}`
- **THEN** the system MUST update `topic`, `mode` (only if not yet started)
- **AND** the system MUST NOT allow updating `expert_id`, `workspace_id` after creation

### Requirement: Session 表 Schema 扩展（Phase 3 新增列）

The system SHALL extend `knlg_interview_session` table with the following columns (added via alembic migration `2026_07_xx_005_phase3_ai_interview.sql`):

| 列名 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `tree_id` | BIGINT NULL | - | 引导问题树 FK，`mode='ai_agent'` 时使用 |
| `waiting_reason` | VARCHAR(255) NULL | - | `status='waiting_for_context'` 时记录原因 |
| `current_turn_index` | INT NOT NULL | 0 | 当前 turn 序号（仅 ai_agent） |
| `max_turns` | INT NOT NULL | 8 | 最大轮数（防失控，仅 ai_agent） |
| `last_event_id` | VARCHAR(64) NULL | - | SSE Last-Event-ID（仅 ai_agent） |
| `started_at` | DATETIME NULL | - | 开始时间（仅 ai_agent；manual 仍用 created_at 推断） |
| `ended_at` | DATETIME NULL | - | 结束时间（仅 ai_agent） |
| `summary` | TEXT NULL | - | AI 自动总结（仅 ai_agent） |

新增索引：`idx_session_mode_status (mode, status)` / `idx_session_tree (tree_id)`。

#### Scenario: 单表查询所有访谈（含 AI + 手工）

- **WHEN** `SELECT * FROM knlg_interview_session WHERE workspace_id=?`
- **THEN** 返回该 workspace 所有访谈（manual + ai_agent），无需 join 第二张 session 表

#### Scenario: AI session 创建后立即可调用 SSE

- **WHEN** 客户端 POST `/qa/sessions` with `mode='ai_agent'` 创建成功
- **THEN** 立刻可调用 `/qa/interview/ai/sessions/{id}/stream`（见 ai-interview-agent spec §5 SSE 协议）

### Requirement: Phase 1 turn 与 AI turn 双写

The system SHALL write to BOTH `knlg_interview_ai_turn` (NEW Phase 3 table) AND `knlg_interview_turn` (Phase 1 table) in a single transaction for each AI turn, so that Phase 4 knowledge card generation can consume Phase 1 turn via SourceRef without knowing about AI internals.

#### Scenario: AI turn 双写成功

- **WHEN** 一个 AI turn 完成（ai-interview-agent service 处理）
- **THEN** 同一事务 INSERT 两张表（AI turn 含 tokens/cost/Prompt version；Phase 1 turn 含 sequence/question/answer）

#### Scenario: AI turn 双写回滚

- **WHEN** AI turn INSERT 失败
- **THEN** Phase 1 turn 也回滚（同一事务，不留半成品）

## ADDED Requirements

### Requirement: 列出 AI 访谈 sessions 辅助端点

The system SHALL expose a dedicated list endpoint for AI interview sessions, scoped by `mode='ai_agent'`:

```
GET /api/v1/workspaces/W/knlg-base/qa/interview/ai/sessions
    ?status=ai_probing&expert_id=X&page=1&page_size=20
```

#### Scenario: 列出 workspace 所有 AI 访谈

- **WHEN** admin 请求该端点
- **THEN** 返回 `mode='ai_agent'` 的 sessions，按 `updated_at DESC` 排序

## REMOVED Requirements

> **No requirements removed in this delta.** All P0 requirements remain in force (only the P0-specific "Reject ai_agent mode" Scenario was modified, see above).

## Cross-References

- 完整 AI 访谈 Agent: [ai-interview-agent spec](../ai-interview-agent/spec.md)
- LLM 客户端: [llm-gateway spec](../llm-gateway/spec.md)
- Prompt 管理: [prompt-management spec](../prompt-management/spec.md)
- 设计文档: [06-interview-agent.md](../../../../design/docs/technical/knlg-base/06-interview-agent)
- 决策记录: [PHASE3-DESIGN-HANDOFF §4.5 决策记录](../../../../design/docs/technical/knlg-base/PHASE3-DESIGN-HANDOFF#45-决策记录2026-07-01-评审锁定)
