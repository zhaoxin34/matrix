# rule-library

## Purpose

TBD — Rule CRUD for the `knlg_rule` entity, encoding knowledge cards into executable form (trigger + conditions + conclusion). P0 provides CRUD and lifecycle state machine only; trigger execution, validation backtest, and execution logs are P3 features.

## Requirements

### Requirement: Rule CRUD

The system SHALL provide complete Create, Read, Update, Delete and lifecycle management operations for rules (`knlg_rule`). A rule encodes a knowledge card into an executable form: trigger (event subscription) + conditions + conclusion. P0 supports CRUD only; rule trigger execution, validation backtest, and execution log are P3 features.

#### Scenario: Create rule

- **WHEN** an authenticated user with `member` or higher role in workspace `W` posts a valid `RuleCreate` payload to `POST /api/v1/workspaces/W/knlg-base/rules`
- **THEN** the system MUST persist a new row in `knlg_rule` with `workspace_id = W.id`, `created_by = current_user.id`, `status = 'draft'`, `version = '1.0'`, `confidence = payload.confidence or 0.5`
- **AND** the system MUST validate that `source_kc_id` exists in workspace `W`
- **AND** the system MUST validate that `trigger`, `conditions`, `conclusion`, `scope` are valid JSON with required schema fields

#### Scenario: Trigger schema validation

- **WHEN** a user creates a rule with `trigger` JSON
- **THEN** the system MUST require the `trigger` to contain: `type` (string, must be `'event_subscription'` in P0), `event_name` (string), optional `filter` (array of `{field, operator, value}`), optional `target_entity`
- **AND** if `type != 'event_subscription'`, the system MUST return HTTP 400 with error code `1001`

#### Scenario: Conditions schema validation

- **WHEN** a user creates a rule with `conditions` JSON
- **THEN** the system MUST require `conditions` to be an array of condition objects: `{field, operator, value, combinator}` where `operator` is one of `==`, `!=`, `>`, `>=`, `<`, `<=`, `in`, `not_in`, `contains`, `regex_match`
- **AND** if any condition has invalid operator, the system MUST return HTTP 400

#### Scenario: Conclusion schema validation

- **WHEN** a user creates a rule with `conclusion` JSON
- **THEN** the system MUST require `conclusion` to be an object with at least one of: `action` (string action name), `message` (string human-readable), `priority` (int), `notify` (array of user IDs)
- **AND** the system MUST reject empty conclusion objects with HTTP 400

#### Scenario: List rules with filters

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/rules` with optional `source_kc_id`, `status`, `min_confidence`, `keyword`, `page`, `page_size`
- **THEN** the system MUST return paginated rules in workspace `W`
- **AND** `keyword` MUST match against `name` and `description` fields with LIKE
- **AND** `min_confidence` MUST filter rules with `confidence >= min_confidence`

#### Scenario: Get rule detail

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/rules/{id}`
- **THEN** the system MUST return `ApiResponse<Rule>` with full rule including `trigger`, `conditions`, `conclusion`, `exceptions`, `execution_stats` JSON fields

#### Scenario: Update rule as Member

- **WHEN** an authenticated user with `member` or higher role updates `PUT /api/v1/workspaces/W/knlg-base/rules/{id}` with valid payload
- **THEN** the system MUST update mutable fields: `name`, `description`, `trigger`, `conditions`, `conclusion`, `exceptions`, `confidence`
- **AND** the system MUST NOT allow updating `workspace_id`, `created_by`, `source_kc_id`, `version`, `published_at`, `execution_stats`

#### Scenario: Delete rule as Admin

- **WHEN** an authenticated user with `admin` or `owner` role requests `DELETE /api/v1/workspaces/W/knlg-base/rules/{id}`
- **THEN** the system MUST perform physical delete
- **AND** the system MUST also delete related `knlg_evidence` rows where `rule_id = {id}` (FK cascade)

### Requirement: Rule Lifecycle States

The system MUST enforce the `knlg_rule.status` state machine: `draft → testing → active → paused → deprecated`. All transitions MUST be triggered by explicit API calls.

#### Scenario: Valid status transitions

- **WHEN** a rule transitions between states
- **THEN** the system MUST only allow the following transitions:
  - `draft → testing` (admin+ only, via explicit API)
  - `testing → active` (admin+ only, via explicit API)
  - `testing → draft` (admin+ only, when testing fails)
  - `active → paused` (admin+ only, via explicit API)
  - `paused → active` (admin+ only, via explicit API)
  - `active → deprecated` (admin+ only, via explicit API)
  - `paused → deprecated` (admin+ only, via explicit API)
  - `deprecated → draft` (admin+ only, re-editing flow)
- **AND** any other transition attempt MUST return HTTP 409 with error code `1005`

#### Scenario: Cannot activate deprecated rule

- **WHEN** an authenticated user attempts to transition `deprecated → active` directly
- **THEN** the system MUST return HTTP 409

#### Scenario: Cannot transition testing → active without confidence check

- **WHEN** an authenticated user attempts `testing → active` on a rule with `confidence < 0.6`
- **THEN** the system MUST return HTTP 400 with error code `1001` and message "Confidence must be >= 0.6 to activate"

### Requirement: Rule Status Operations

The system SHALL provide explicit API endpoints for status transitions.

#### Scenario: Publish rule (draft → testing)

- **WHEN** an authenticated user with `admin` or `owner` role requests `POST /api/v1/workspaces/W/knlg-base/rules/{id}/publish`
- **THEN** the system MUST transition status from `draft` to `testing`
- **AND** the system MUST reject if current status is not `draft`

#### Scenario: Activate rule (testing → active)

- **WHEN** an authenticated user with `admin` or `owner` role requests `POST /api/v1/workspaces/W/knlg-base/rules/{id}/activate`
- **THEN** the system MUST transition status from `testing` to `active`
- **AND** the system MUST reject if current status is not `testing`

#### Scenario: Pause rule (active → paused)

- **WHEN** an authenticated user with `admin` or `owner` role requests `POST /api/v1/workspaces/W/knlg-base/rules/{id}/pause`
- **THEN** the system MUST transition status from `active` to `paused`

#### Scenario: Deprecate rule (any → deprecated)

- **WHEN** an authenticated user with `admin` or `owner` role requests `POST /api/v1/workspaces/W/knlg-base/rules/{id}/deprecate`
- **THEN** the system MUST transition status to `deprecated`
- **AND** deprecated rules MUST still be readable but MUST NOT appear in default active lists

### Requirement: Rule Evidence CRUD (READ-ONLY in P0)

The system SHALL support reading rule evidence (`knlg_evidence`), but P0 phase MUST NOT expose POST/PUT/DELETE endpoints for evidence creation. Evidence is created by the trigger engine (P3) or manually imported from external sources (P1+).

#### Scenario: List rule evidence

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/rules/{id}/evidences` with optional `case_source`, `validator_type`, `page`, `page_size`
- **THEN** the system MUST return paginated evidence rows in workspace `W`

#### Scenario: Get evidence detail

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/rules/{id}/evidences/{evidence_id}`
- **THEN** the system MUST return `ApiResponse<Evidence>` with full evidence including `case_data` JSON

#### Scenario: Reject manual evidence creation

- **WHEN** an authenticated user attempts `POST /api/v1/workspaces/W/knlg-base/rules/{id}/evidences`
- **THEN** the system MUST return HTTP 405 (Method Not Allowed)

### Requirement: Rule Permission Matrix

The system MUST enforce the following role-based permissions for rule operations:

| 操作 | Owner | Admin | Member | Guest |
| --- | --- | --- | --- | --- |
| 读取（list/detail/evidences） | ✅ | ✅ | ✅ | ✅ |
| 创建 | ✅ | ✅ | ✅ | ❌ |
| 更新（草稿状态） | ✅ | ✅ | ✅ | ❌ |
| 删除 | ✅ | ✅ | ❌ | ❌ |
| 状态变更（publish/activate/pause/deprecate） | ✅ | ✅ | ❌ | ❌ |

#### Scenario: Guest read-only access

- **WHEN** an authenticated user with `guest` role requests list or detail endpoints
- **THEN** the system MUST allow the read operation
- **AND** the system MUST NOT show "Edit", "Delete", status-change buttons in the UI

#### Scenario: Member cannot delete or change status

- **WHEN** an authenticated user with `member` role attempts delete or status-change operations
- **THEN** the system MUST return HTTP 403 with error code `1003`

### Requirement: Rule API Contract

The system MUST expose rule endpoints under the base path `/api/v1/workspaces/{workspace_code}/knlg-base/rules`, and MUST follow the Neo platform API response format.

#### Scenario: Standard response shape

- **WHEN** any rule API returns successfully
- **THEN** the response MUST contain `code: 0`, `message: "ok"`, `data: <payload>`, `traceId: <uuid>`, `timestamp: <unix_ms>`

#### Scenario: Standard error shape

- **WHEN** any rule API returns an error (4xx / 5xx)
- **THEN** the response MUST contain `code: <error_code>`, `message: <human_readable>`, `traceId: <uuid>`, `timestamp: <unix_ms>`, and MUST NOT include `data`

#### Scenario: JSON field validation

- **WHEN** a user submits invalid JSON in `trigger` / `conditions` / `conclusion` / `exceptions` / `scope`
- **THEN** the system MUST return HTTP 400 with error code `1001` and a descriptive message identifying the offending field

### Requirement: Rule Data Isolation

The system MUST enforce strict workspace isolation for rules: every row in `knlg_rule` and `knlg_evidence` MUST be scoped to one workspace via `workspace_id`, and cross-workspace queries MUST return 404.

#### Scenario: Cross-workspace access returns 404

- **WHEN** an authenticated user attempts to access a rule or evidence from workspace `W1` while querying workspace `W2`
- **THEN** the system MUST return HTTP 404 with error code `1004`

#### Scenario: Source KC must belong to same workspace

- **WHEN** a user creates or updates a rule with `source_kc_id` referencing a knowledge card in another workspace
- **THEN** the system MUST return HTTP 400 with error code `1001` and message "Source knowledge card not found in this workspace"
