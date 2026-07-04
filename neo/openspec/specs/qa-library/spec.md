# qa-library

## Purpose

TBD — Question tree templates, questions, interview sessions, interviews, Q&A turns, and turn references for the QA Library subsystem. P0 supports manual CRUD only; AI agent-driven interviews and followup generation are P1+.
## Requirements
### Requirement: Question Tree Template CRUD

The system SHALL provide complete Create, Read, Update, Delete operations for interview question tree templates (`knlg_question_tree`). Question trees are reusable templates that organize questions in a hierarchical structure with followups for AI-driven expert interviews.

#### Scenario: Create question tree template

- **WHEN** an authenticated user with `member` or higher role in workspace `W` posts a valid `QuestionTreeCreate` payload to `POST /api/v1/workspaces/W/knlg-base/qa/question-trees`
- **THEN** the system MUST persist a new row in `knlg_question_tree` with `workspace_id = W.id`, `created_by = current_user.id`, `version = '1.0'`, `is_active = true`
- **AND** the system MUST validate that `questions` JSON contains required fields: array of objects with `id` (string), `text` (string), optional `followups` (array of strings)

#### Scenario: List question trees with filter

- **WHEN** an authenticated user with at least `guest` role requests `GET /api/v1/workspaces/W/knlg-base/qa/question-trees` with optional `domain`, `is_active`, `page`, `page_size`
- **THEN** the system MUST return paginated list of templates in workspace `W`, filtered by domain and is_active flags

#### Scenario: Get question tree detail

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/qa/question-trees/{id}`
- **THEN** the system MUST return `ApiResponse<QuestionTree>` with full template including `questions` JSON and `version`

#### Scenario: Update question tree creates new version

- **WHEN** an authenticated user with `admin` or `owner` role updates `PUT /api/v1/workspaces/W/knlg-base/qa/question-trees/{id}` with new content
- **THEN** the system MUST create a NEW row with the same `name`, updated content, incremented `version` (semantic version-like increment), `is_active = true`, and `created_by = current_user.id`
- **AND** the system MUST mark the previous version with `is_active = false`

> **Note**：Question tree uses versioned overwrite (每次更新产生新版本，旧版本保留只读)

#### Scenario: Delete question tree as Admin

- **WHEN** an authenticated user with `admin` or `owner` role requests `DELETE /api/v1/workspaces/W/knlg-base/qa/question-trees/{id}`
- **THEN** the system MUST perform physical delete
- **AND** the system MUST return HTTP 409 (error code `1005`) if any `knlg_question.tree_id` references this tree

### Requirement: Question CRUD

The system SHALL provide complete CRUD operations for interview questions (`knlg_question`). Questions are individual interview prompts that can be organized in trees and linked to multiple interviews.

#### Scenario: Create question

- **WHEN** an authenticated user with `member` or higher role posts to `POST /api/v1/workspaces/W/knlg-base/qa/questions`
- **THEN** the system MUST persist a row in `knlg_question` with `workspace_id = W.id`, `created_by = current_user.id`, `status = 'pending'`, optional `tree_id`, optional `parent_question_id`, optional `tags`, optional `priority`
- **AND** if `parent_question_id` is provided, the system MUST validate it exists in workspace `W`
- **AND** if `tree_id` is provided, the system MUST validate it exists in workspace `W`

#### Scenario: List questions with keyword and filters

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/qa/questions` with optional `domain`, `status`, `tags` (comma-separated), `keyword`, `tree_id`, `page`, `page_size`
- **THEN** the system MUST return paginated questions in workspace `W`
- **AND** `keyword` MUST match against `text` field using LIKE
- **AND** `tags` MUST filter questions whose `tags` JSON array contains ALL specified tags

#### Scenario: Question detail includes interview count

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/qa/questions/{id}`
- **THEN** the response MUST include the question fields PLUS `interview_count` (number of `knlg_interview` rows where `question_id = {id}`)

#### Scenario: Update question

- **WHEN** an authenticated user with `member` or higher role updates `PUT /api/v1/workspaces/W/knlg-base/qa/questions/{id}` with valid payload
- **THEN** the system MUST update mutable fields: `text`, `domain`, `tags`, `priority`, `tree_id`, `parent_question_id`
- **AND** the system MUST NOT allow updating `workspace_id`, `created_by`, `status` directly via this endpoint

#### Scenario: Archive question (soft delete)

- **WHEN** an authenticated user with `admin` or `owner` role requests `PATCH /api/v1/workspaces/W/knlg-base/qa/questions/{id}/archive`
- **THEN** the system MUST update `status` to `'archived'`
- **AND** archived questions MUST NOT appear in default list queries (only when `status=archived` filter is explicit)
- **AND** the system MUST NOT physically delete questions (产品理念：问答库是原始认知数据源，不能丢)

#### Scenario: Auto-update question status on first interview

- **WHEN** an interview is created referencing a question with `status = 'pending'`
- **THEN** the system MUST automatically update the question's `status` to `'in_progress'`
- **AND** when the interview is completed, the system MUST update `status` to `'answered'`

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

### Requirement: Interview CRUD

The system SHALL provide CRUD operations for individual interviews (`knlg_interview`). An interview is a single Q&A interaction flow with a specific expert, starting from a specific question. P0 supports manual interviews; AI-driven interviews (with `summary` auto-generated) are P1+.

#### Scenario: Create interview

- **WHEN** an authenticated user with `member` or higher role posts to `POST /api/v1/workspaces/W/knlg-base/qa/interviews`
- **THEN** the system MUST persist a row in `knlg_interview` with `workspace_id = W.id`, `session_id`, `question_id`, `expert_id`, `mode = 'manual'`, `started_at = NOW()`
- **AND** the system MUST validate that `session_id`, `question_id`, `expert_id` exist in workspace `W`

#### Scenario: List interviews with filters

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/qa/interviews` with optional `session_id`, `question_id`, `expert_id`, `mode`, `page`, `page_size`
- **THEN** the system MUST return paginated interviews in workspace `W`

#### Scenario: Get interview detail with Q&A turns

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/qa/interviews/{id}`
- **THEN** the response MUST include interview fields PLUS `turns` array (all `knlg_interview_turn` rows ordered by `sequence ASC`)

#### Scenario: End interview

- **WHEN** an authenticated user with `member` or higher role requests `POST /api/v1/workspaces/W/knlg-base/qa/interviews/{id}/end`
- **THEN** the system MUST set `ended_at = NOW()`
- **AND** the system MUST auto-update the linked question's `status` to `'answered'`

### Requirement: Interview Turn CRUD

The system SHALL provide CRUD operations for individual Q&A turns within an interview (`knlg_interview_turn`). A turn is one question-answer pair in the interview flow, with support for followup chains via `parent_turn_id`.

#### Scenario: Add turn to interview

- **WHEN** an authenticated user with `member` or higher role posts to `POST /api/v1/workspaces/W/knlg-base/qa/interviews/{interview_id}/turns`
- **THEN** the system MUST persist a row in `knlg_interview_turn` with `interview_id = {interview_id}`, auto-incremented `sequence` (last + 1), `question`, `answer`, optional `parent_turn_id`, optional `type` (default `'initial'`), optional `confidence`, optional `tags`
- **AND** if `parent_turn_id` is provided, the system MUST validate it belongs to the same interview

#### Scenario: Update turn

- **WHEN** an authenticated user with `member` or higher role updates `PUT /api/v1/workspaces/W/knlg-base/qa/interviews/{interview_id}/turns/{turn_id}`
- **THEN** the system MUST update `question`, `answer`, `type`, `confidence`, `tags`, `metadata`
- **AND** the system MUST NOT allow updating `interview_id`, `expert_id`, `workspace_id`, `sequence`

#### Scenario: Delete turn

- **WHEN** an authenticated user with `admin` or `owner` role requests `DELETE /api/v1/workspaces/W/knlg-base/qa/interviews/{interview_id}/turns/{turn_id}`
- **THEN** the system MUST perform physical delete
- **AND** the system MUST also delete all `knlg_interview_turn` rows where `parent_turn_id = {turn_id}` (cascade)
- **AND** the system MUST also delete all `knlg_interview_turn_ref` rows referencing this turn (cascade)

#### Scenario: Reorder turns

- **WHEN** an authenticated user with `admin` or `owner` role requests `PUT /api/v1/workspaces/W/knlg-base/qa/interviews/{interview_id}/turns/reorder` with `[{turn_id, sequence}, ...]`
- **THEN** the system MUST update `sequence` for each turn atomically (all-or-nothing transaction)
- **AND** the system MUST validate that all turn_ids belong to this interview

### Requirement: Interview Turn Reference CRUD

The system SHALL provide CRUD operations for Q&A turn references (`knlg_interview_turn_ref`). References model relationships between turns: `support`, `counter_example`, `refine`, `derived_from`, `replaced_by`.

#### Scenario: Create turn reference

- **WHEN** an authenticated user with `member` or higher role posts to `POST /api/v1/workspaces/W/knlg-base/qa/turn-refs`
- **THEN** the system MUST persist a row with `source_turn_id`, `target_turn_id`, `relation` (one of the 5 enum values), optional `note`, `created_by = current_user.id`
- **AND** the system MUST validate that both turns exist in workspace `W`
- **AND** the system MUST enforce unique constraint on `(source_turn_id, target_turn_id, relation)`

#### Scenario: List references by turn

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/qa/turns/{turn_id}/refs` with optional `relation`
- **THEN** the system MUST return all `knlg_interview_turn_ref` rows where `source_turn_id = {turn_id}` OR `target_turn_id = {turn_id}`

#### Scenario: Delete turn reference

- **WHEN** an authenticated user with `member` or higher role requests `DELETE /api/v1/workspaces/W/knlg-base/qa/turn-refs/{id}`
- **THEN** the system MUST perform physical delete

### Requirement: QA Library Permission Matrix

The system MUST enforce the following role-based permissions for QA library operations:

| 操作 | Owner | Admin | Member | Guest |
| --- | --- | --- | --- | --- |
| 读取（list/detail） | ✅ | ✅ | ✅ | ✅ |
| 创建问题树/问题/会话/访谈/问答 | ✅ | ✅ | ✅ | ❌ |
| 更新（自己的/参与的内容） | ✅ | ✅ | ✅ | ❌ |
| 删除 | ✅ | ✅ | ❌ | ❌ |
| 归档问题 | ✅ | ✅ | ❌ | ❌ |

#### Scenario: Guest read-only access

- **WHEN** an authenticated user with `guest` role requests list or detail endpoints
- **THEN** the system MUST allow the read operation
- **AND** the system MUST NOT show "Edit", "Delete", "Archive", "Add Turn" buttons in the UI

#### Scenario: Member cannot delete

- **WHEN** an authenticated user with `member` role attempts delete / archive operations
- **THEN** the system MUST return HTTP 403 with error code `1003`

#### Scenario: Interview sessions support both member and admin

- **WHEN** any of `member` / `admin` / `owner` creates an interview session
- **THEN** the system MUST allow the operation
- **AND** all three roles MUST be able to add turns, end sessions, end interviews

### Requirement: QA Library API Contract

The system MUST expose QA library endpoints under the base path `/api/v1/workspaces/{workspace_code}/knlg-base/qa`, and MUST follow the Neo platform API response format `{code, message, data, traceId, timestamp}`.

#### Scenario: Standard response shape

- **WHEN** any QA library API returns successfully
- **THEN** the response MUST contain `code: 0`, `message: "ok"`, `data: <payload>`, `traceId: <uuid>`, `timestamp: <unix_ms>`

#### Scenario: Standard error shape

- **WHEN** any QA library API returns an error (4xx / 5xx)
- **THEN** the response MUST contain `code: <error_code>`, `message: <human_readable>`, `traceId: <uuid>`, `timestamp: <unix_ms>`, and MUST NOT include `data`

#### Scenario: Keyword search uses LIKE

- **WHEN** an authenticated user provides a `keyword` parameter to list endpoints
- **THEN** the system MUST apply `LIKE '%keyword%'` to the searchable text fields (e.g., `knlg_question.text`, `knlg_question_tree.name`)
- **AND** the system MUST NOT use FULLTEXT indexing in P0 (P1+ evaluation)

### Requirement: QA Library Data Isolation

The system MUST enforce strict workspace isolation: every row in `knlg_question_tree`, `knlg_question`, `knlg_interview_session`, `knlg_interview`, `knlg_interview_turn`, `knlg_interview_turn_ref` MUST be scoped to one workspace via `workspace_id`, and cross-workspace queries MUST return 404 (no information leakage).

#### Scenario: Cross-workspace access returns 404

- **WHEN** an authenticated user attempts to access a question / interview / turn from workspace `W1` while querying workspace `W2`
- **THEN** the system MUST return HTTP 404 with error code `1004`

#### Scenario: Service layer validates workspace ownership

- **WHEN** a service method is called with `workspace_id` and entity id
- **THEN** the service MUST first query the entity with `WHERE id = ? AND workspace_id = ?`
- **AND** if the query returns no row, the service MUST raise `BusinessException(NOT_FOUND)` regardless of whether the entity exists in another workspace

### Requirement: Phase 1 turn 与 AI turn 双写（Phase 3 defer）

The system MUST NOT write to `knlg_interview_turn` from AI Agent sessions in Phase 3; deferring this requirement to Phase 4 (knowledge-card consumer). Rationale: `knlg_interview_turn.interview_id` is NOT NULL and depends on `knlg_interview` (which requires `question_id + expert_id`), and AI Agent sessions by design do not create `KnlgInterview` records. Phase 4 will migrate via (a) `interview_id` nullable + add `session_id`, or (b) auto-create synthetic `KnlgInterview` per AI turn.

#### Scenario: 双写 defer 不会丢失 AI turn

- **WHEN** Phase 3 任一 AI turn 写入 `knlg_interview_ai_turn` 成功
- **THEN** 对应 Phase 1 `knlg_interview_turn` 可不写（deferred），AI turn 仍可通过 SourceRef 独立消费
- **AND** Phase 4 启动时，会以新 change 补上双写路径

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

### Requirement: 列出 AI 访谈 sessions 辅助端点

The system SHALL expose a dedicated list endpoint for AI interview sessions, scoped by `mode='ai_agent'`:

```
GET /api/v1/workspaces/W/knlg-base/qa/interview/ai/sessions
    ?status=ai_probing&expert_id=X&page=1&page_size=20
```

#### Scenario: 列出 workspace 所有 AI 访谈

- **WHEN** admin 请求该端点
- **THEN** 返回 `mode='ai_agent'` 的 sessions，按 `updated_at DESC` 排序

