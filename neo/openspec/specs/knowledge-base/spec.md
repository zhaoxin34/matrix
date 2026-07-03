# knowledge-base

## Purpose

TBD — Knowledge card CRUD for the `knlg_knowledge_card` workspace-scoped entity, including lifecycle state machine, source references, search/filter, role-based permissions, and standard API contract.

## Requirements

### Requirement: Knowledge Card CRUD

The system SHALL provide complete Create, Read, Update, Delete and lifecycle management operations for knowledge cards (`knlg_knowledge_card`) within a workspace. All operations MUST be automatically scoped to the workspace identified by the URL path parameter `workspace_code`, and MUST enforce role-based permissions based on the requesting user's `WorkspaceMember` role.

#### Scenario: List knowledge cards with pagination and filters

- **WHEN** an authenticated user with at least `guest` role in workspace `W` requests `GET /api/v1/workspaces/W/knlg-base/knowledge` with valid `page`, `page_size`, optional `domain`, optional `type`, optional `status`, and optional `keyword` parameters
- **THEN** the system MUST return a paginated list of `knlg_knowledge_card` rows where `workspace_id = W.id`, filtered by the supplied parameters (keyword matches title / statement / conditions / exceptions with LIKE)
- **AND** the response MUST follow the standard `ApiResponse<ListResponse<KnowledgeCard>>` shape with `items`, `total`, `page`, `page_size`, `total_pages`

#### Scenario: Create knowledge card as Member

- **WHEN** an authenticated user with `member` or higher role in workspace `W` posts a valid `KnowledgeCardCreate` payload to `POST /api/v1/workspaces/W/knlg-base/knowledge`
- **THEN** the system MUST persist a new row in `knlg_knowledge_card` with `workspace_id = W.id`, `created_by = current_user.id`, `status = 'draft'`, `version = '1.0'`, `validation_status = 'pending_validation'`, `confidence = payload.confidence or 0.5`
- **AND** the system MUST return `ApiResponse<KnowledgeCard>` with the created record including `id`, `created_at`, `updated_at`

#### Scenario: Reject create when Guest

- **WHEN** an authenticated user with `guest` role only in workspace `W` attempts to create a knowledge card
- **THEN** the system MUST return HTTP 403 with error code `1003` and message "Permission denied"

#### Scenario: Get knowledge card detail

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/knowledge/cards/{id}` where `id` belongs to workspace `W`
- **THEN** the system MUST return `ApiResponse<KnowledgeCard>` with the full card including `tags`, `key_signals`, `conditions`, `exceptions`, `source_turn_ids`, `source_doc_ids`, `expert_ids`

#### Scenario: Return 404 when card belongs to another workspace

- **WHEN** an authenticated user requests a knowledge card whose `workspace_id` does NOT match the path workspace `W`
- **THEN** the system MUST return HTTP 404 with error code `1004` (the system MUST NOT distinguish "not found" from "wrong workspace" to prevent information leakage)

#### Scenario: Update knowledge card as Member

- **WHEN** an authenticated user with `member` or higher role updates `PUT /api/v1/workspaces/W/knlg-base/knowledge/cards/{id}` with valid `KnowledgeCardUpdate` payload
- **THEN** the system MUST update mutable fields (title, statement, domain, tags, type, key_signals, conditions, exceptions, confidence) and bump `updated_at`
- **AND** the system MUST NOT allow updating `workspace_id`, `created_by`, `created_at`, `source_turn_ids`, `source_doc_ids`, `source_pattern_ids`, `expert_ids`, `version`, `published_at` directly via this endpoint

#### Scenario: Delete knowledge card as Admin

- **WHEN** an authenticated user with `admin` or `owner` role requests `DELETE /api/v1/workspaces/W/knlg-base/knowledge/cards/{id}`
- **THEN** the system MUST perform a physical delete of the row
- **AND** the system MUST also delete related `knlg_source_ref` rows referencing this card (via FK cascade)

#### Scenario: Reject delete when Member

- **WHEN** an authenticated user with `member` role attempts to delete a knowledge card
- **THEN** the system MUST return HTTP 403 with error code `1003`

#### Scenario: Publish knowledge card as Admin

- **WHEN** an authenticated user with `admin` or `owner` role requests `POST /api/v1/workspaces/W/knlg-base/knowledge/cards/{id}/publish`
- **THEN** the system MUST update `status` to `'published'` and set `published_at = NOW()`
- **AND** the system MUST NOT allow publishing a card whose `validation_status = 'pending_validation'` (return 409 conflict)

#### Scenario: Deprecate knowledge card as Admin

- **WHEN** an authenticated user with `admin` or `owner` role requests `POST /api/v1/workspaces/W/knlg-base/knowledge/cards/{id}/deprecate`
- **THEN** the system MUST update `status` to `'deprecated'`
- **AND** deprecated cards MUST still be readable (list / detail) but MUST NOT appear in default active lists

#### Scenario: List knowledge card versions

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/knowledge/cards/{id}/versions`
- **THEN** the system MUST return `ApiResponse<ListResponse<KnowledgeCardVersion>>` with all rows from `knlg_knowledge_card_version` ordered by `created_at DESC`

> **Note**：P0 阶段暂不实现版本对比 / diff UI（仅提供版本列表 API）。版本对比属于 P1+ 功能。

### Requirement: Knowledge Card Source References (READ-ONLY)

The system SHALL automatically manage `knlg_source_ref` rows when a knowledge card is created from interviews or documents, but in P0 phase the `POST /sources` endpoint is OPTIONAL and source_ref management is performed by SERVICE layer only (not exposed as REST endpoint).

#### Scenario: Read source refs of a card

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/knowledge/cards/{id}/sources`
- **THEN** the system MUST return `ApiResponse<ListResponse<SourceRef>>` with all `knlg_source_ref` rows for the card

#### Scenario: Create source ref via service (internal only)

- **WHEN** a service-layer method creates a knowledge card and the input contains `source_turn_ids` or `source_doc_ids`
- **THEN** the service MUST insert corresponding `knlg_source_ref` rows with `source_type = 'expert_interview'` or `'document'` and `contribution_weight = 1.0` by default

> **Note**：P0 不暴露 POST/PUT/DELETE `/sources` 端点（CRUD 由 service 层封装）。P1+ 再提供完整 REST 接口。

### Requirement: Knowledge Card Lifecycle States

The system MUST enforce the `knlg_knowledge_card.status` state machine: `draft → reviewing → published → deprecated`. All transitions MUST be triggered by explicit API calls or system events, and MUST NOT allow backward transitions except `deprecated → draft` (re-edit by admin).

#### Scenario: Valid status transitions

- **WHEN** a knowledge card transitions between states
- **THEN** the system MUST only allow the following transitions:
  - `draft → reviewing` (via explicit API call, admin+ only)
  - `reviewing → published` (via explicit API call, admin+ only, requires `validation_status != 'pending_validation'`)
  - `reviewing → draft` (via explicit API call, admin+ only, when validation fails)
  - `published → deprecated` (via explicit API call, admin+ only)
  - `deprecated → draft` (via explicit API call, admin+ only, re-editing flow)
- **AND** any other transition attempt MUST return HTTP 409 with error code `1005`

#### Scenario: Validation status coupled to review

- **WHEN** a card is in `reviewing` status
- **THEN** `validation_status` MUST be one of: `pending_validation`, `partially_validated`, `validated`, `auto_published`
- **AND** the system MUST NOT allow `published` status if `validation_status = 'pending_validation'`

### Requirement: Knowledge Card Search and Filtering

The system MUST support filtering knowledge cards by `domain`, `type`, `status`, `validation_status`, and free-text `keyword` on the list endpoint, with all filters combined using AND logic.

#### Scenario: Multi-filter list query

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/knowledge?domain=opportunity&type=judgement&status=published&keyword=manufacturing`
- **THEN** the system MUST return cards where:
  - `workspace_id = W.id`
  - `domain = 'opportunity'`
  - `type = 'judgement'`
  - `status = 'published'`
  - AND (`title LIKE '%manufacturing%' OR statement LIKE '%manufacturing%' OR conditions LIKE '%manufacturing%' OR exceptions LIKE '%manufacturing%'`)

#### Scenario: Invalid filter parameter

- **WHEN** an authenticated user provides an invalid `type` value (not in enum `judgement / risk / opportunity / process / communication / competitive`)
- **THEN** the system MUST return HTTP 400 with error code `1001` and message describing the valid values

### Requirement: Knowledge Card Permission Matrix

The system MUST enforce the following role-based permissions for knowledge card operations:

| 操作 | Owner | Admin | Member | Guest |
| --- | --- | --- | --- | --- |
| 读取（list/detail/versions/sources）| ✅ | ✅ | ✅ | ✅ |
| 创建 | ✅ | ✅ | ✅ | ❌ |
| 更新（普通字段） | ✅ | ✅ | ✅ | ❌ |
| 删除 | ✅ | ✅ | ❌ | ❌ |
| 发布 / 废弃 | ✅ | ✅ | ❌ | ❌ |
| 状态变更（draft → reviewing） | ✅ | ✅ | ❌ | ❌ |

#### Scenario: Guest read-only access

- **WHEN** an authenticated user with `guest` role requests list or detail endpoints
- **THEN** the system MUST allow the read operation
- **AND** the system MUST NOT show "Edit", "Delete", "Publish", "Deprecate" buttons in the corresponding UI components

#### Scenario: Member cannot publish

- **WHEN** an authenticated user with `member` role attempts any publish / deprecate / status-change operation
- **THEN** the system MUST return HTTP 403 with error code `1003`

### Requirement: Knowledge Card API Contract

The system MUST expose knowledge card endpoints under the base path `/api/v1/workspaces/{workspace_code}/knlg-base/knowledge`, and MUST follow the Neo platform API response format `{code, message, data, traceId, timestamp}`.

#### Scenario: Standard response shape

- **WHEN** any knowledge card API returns successfully
- **THEN** the response MUST contain `code: 0`, `message: "ok"`, `data: <payload>`, `traceId: <uuid>`, `timestamp: <unix_ms>`

#### Scenario: Standard error shape

- **WHEN** any knowledge card API returns an error (4xx / 5xx)
- **THEN** the response MUST contain `code: <error_code>`, `message: <human_readable>`, `traceId: <uuid>`, `timestamp: <unix_ms>`, and MUST NOT include `data`

#### Scenario: Pagination defaults

- **WHEN** a list endpoint is called without `page` / `page_size`
- **THEN** the system MUST default to `page = 1`, `page_size = 20`
- **AND** the system MUST reject `page_size > 100` with HTTP 400
