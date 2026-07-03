# knowledge-import

## Purpose

TBD — Source document upload + import job tracking for `knlg_document`, `knlg_import_job`, and `knlg_parsed_chunk` entities. P0 provides CRUD only; actual parsing (PDF/Word/MD text extraction, classification, signal extraction) is delegated to P2 Document Parser.

## Requirements

### Requirement: Document Upload (CRUD only, no parsing in P0)

The system SHALL provide Create / List / Get / Delete operations for source documents (`knlg_document`). Uploading a document in P0 records its metadata in the database and stores the file via the existing RustFS storage service. **Actual content parsing (PDF/Word/MD text extraction, classification, signal extraction) is NOT performed in P0** — it belongs to P2 (Document Parser module).

#### Scenario: Upload document

- **WHEN** an authenticated user with `member` or higher role in workspace `W` uploads a file via `POST /api/v1/workspaces/W/knlg-base/import/upload` (multipart/form-data with `file`, `name`, `type`)
- **THEN** the system MUST:
  1. Validate the file (size <= 50MB for P0; type whitelist: `pdf / docx / md / txt / csv / confluence`)
  2. Upload the file to RustFS via the existing `storage.service` module
  3. Compute SHA-256 hash of the file content
  4. Persist a row in `knlg_document` with `workspace_id = W.id`, `name`, `type`, `file_path` (RustFS path), `file_size`, `hash`, `imported_by = current_user.id`, `imported_at = NOW()`
  5. Return `ApiResponse<Document>` with the created record

#### Scenario: Reject oversized file

- **WHEN** a user uploads a file larger than 50MB
- **THEN** the system MUST return HTTP 400 with error code `1001` and message "File size exceeds 50MB limit"

#### Scenario: Reject unsupported file type

- **WHEN** a user uploads a file with `type` not in whitelist
- **THEN** the system MUST return HTTP 400 with error code `1001` and message listing valid types

#### Scenario: Duplicate detection via hash

- **WHEN** a user uploads a file whose SHA-256 hash already exists in workspace `W`'s `knlg_document`
- **THEN** the system MUST return HTTP 409 with error code `1005` and include the existing document's `id` and `name`
- **AND** the system MUST NOT re-upload the file

#### Scenario: List documents

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/import/documents` with optional `type`, `page`, `page_size`
- **THEN** the system MUST return paginated documents in workspace `W`, ordered by `imported_at DESC`

#### Scenario: Get document detail

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/import/documents/{id}`
- **THEN** the response MUST include: `name`, `type`, `file_size`, `hash`, `imported_by`, `imported_at`, `metadata`, plus the count of associated import jobs

#### Scenario: Delete document as Admin

- **WHEN** an authenticated user with `admin` or `owner` role requests `DELETE /api/v1/workspaces/W/knlg-base/import/documents/{id}`
- **THEN** the system MUST delete the RustFS file (only if no other documents reference it)
- **AND** the system MUST also delete related `knlg_import_job` rows (FK cascade)
- **AND** the system MUST return HTTP 409 if any active (`status IN ('pending', 'parsing', 'classifying', 'extracting')`) import job exists

#### Scenario: Document metadata optional

- **WHEN** a user uploads a document
- **THEN** the system MUST NOT require `metadata` (it is optional JSON)
- **AND** the system MUST NOT require `source_url` (it is optional, used for wiki/confluence URL sources)

### Requirement: Import Job CRUD (P0 creates pending jobs only)

The system SHALL provide CRUD operations for import jobs (`knlg_import_job`). In P0, jobs are created in `pending` status; the actual transition through `parsing → classifying → extracting → completed/failed` is driven by P2 (Document Parser). The P0 API allows queries and manual status updates for testing/admin purposes.

#### Scenario: Create import job

- **WHEN** an authenticated user with `member` or higher role posts to `POST /api/v1/workspaces/W/knlg-base/import/jobs` with `{document_id}`
- **THEN** the system MUST persist a row in `knlg_import_job` with `workspace_id = W.id`, `document_id`, `status = 'pending'`, `progress = 0.0`, `created_at = NOW()`
- **AND** the system MUST validate `document_id` exists in workspace `W`

#### Scenario: List import jobs

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/import/jobs` with optional `document_id`, `status`, `page`, `page_size`
- **THEN** the system MUST return paginated jobs in workspace `W`, ordered by `created_at DESC`

#### Scenario: Get import job detail

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/import/jobs/{id}`
- **THEN** the response MUST include: `document_id`, `status`, `progress`, `started_at`, `finished_at`, `result_summary` JSON, `error_message`
- **AND** the response MUST include associated `parsed_chunks` array (from `knlg_parsed_chunk` where `job_id = {id}`, ordered by `chunk_order ASC`)

#### Scenario: Update job status manually (admin only)

- **WHEN** an authenticated user with `admin` or `owner` role requests `PATCH /api/v1/workspaces/W/knlg-base/import/jobs/{id}/status` with `{status, progress, error_message?}`
- **THEN** the system MUST update `status`, `progress`, optional `error_message`
- **AND** if `status = 'completed'` or `'failed'` and `finished_at` is NULL, the system MUST set `finished_at = NOW()`
- **AND** if `status = 'parsing'` and `started_at` is NULL, the system MUST set `started_at = NOW()`

> **Note**：P0 阶段此端点供 P2 文档解析器集成使用（解析器调用此端点更新进度）。也可供管理员手动调整测试。

#### Scenario: Cancel import job

- **WHEN** an authenticated user with `admin` or `owner` role requests `POST /api/v1/workspaces/W/knlg-base/import/jobs/{id}/cancel`
- **THEN** the system MUST update `status` to `'failed'` with `error_message = 'Cancelled by user'`, `finished_at = NOW()`
- **AND** the system MUST reject cancellation if `status = 'completed'` (already finished)

#### Scenario: Delete import job as Admin

- **WHEN** an authenticated user with `admin` or `owner` role requests `DELETE /api/v1/workspaces/W/knlg-base/import/jobs/{id}`
- **THEN** the system MUST perform physical delete
- **AND** the system MUST also delete related `knlg_parsed_chunk` rows (FK cascade)
- **AND** the system MUST also delete related `knlg_candidate_kc` rows (FK cascade)

### Requirement: Parsed Chunk READ-ONLY (P2 owns this)

The system SHALL provide READ-ONLY access to `knlg_parsed_chunk` rows. Parsed chunks are created by P2 (Document Parser). P0 MUST NOT expose POST/PUT/DELETE endpoints for parsed chunks.

#### Scenario: List parsed chunks by job

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/import/jobs/{id}/chunks` with optional `category`, `page`, `page_size`
- **THEN** the system MUST return paginated chunks for the job, ordered by `chunk_order ASC`

#### Scenario: Get parsed chunk detail

- **WHEN** an authenticated user requests `GET /api/v1/workspaces/W/knlg-base/import/jobs/{job_id}/chunks/{chunk_id}`
- **THEN** the response MUST include `content`, `category`, `key_signals` JSON, `confidence_hint`

### Requirement: Knowledge Import Permission Matrix

The system MUST enforce the following role-based permissions:

| 操作 | Owner | Admin | Member | Guest |
| --- | --- | --- | --- | --- |
| 读取（list/detail） | ✅ | ✅ | ✅ | ✅ |
| 上传文档 | ✅ | ✅ | ✅ | ❌ |
| 创建导入任务 | ✅ | ✅ | ✅ | ❌ |
| 取消任务 | ✅ | ✅ | ❌ | ❌ |
| 手动更新状态（调试） | ✅ | ✅ | ❌ | ❌ |
| 删除 | ✅ | ✅ | ❌ | ❌ |

#### Scenario: Guest read-only access

- **WHEN** an authenticated user with `guest` role requests list or detail endpoints
- **THEN** the system MUST allow the read operation
- **AND** the system MUST NOT show "Upload", "Cancel", "Delete" buttons in the UI

#### Scenario: Member cannot cancel or delete

- **WHEN** an authenticated user with `member` role attempts cancel / delete operations
- **THEN** the system MUST return HTTP 403 with error code `1003`

### Requirement: Knowledge Import API Contract

The system MUST expose knowledge import endpoints under the base path `/api/v1/workspaces/{workspace_code}/knlg-base/import`, and MUST follow the Neo platform API response format.

#### Scenario: Standard response shape (JSON)

- **WHEN** any non-upload import API returns successfully
- **THEN** the response MUST contain `code: 0`, `message: "ok"`, `data: <payload>`, `traceId: <uuid>`, `timestamp: <unix_ms>`

#### Scenario: Multipart upload response

- **WHEN** the upload endpoint returns successfully
- **THEN** the response MUST be `ApiResponse<Document>` JSON (NOT the file binary)
- **AND** the file MUST be downloadable separately via a signed URL (P0: direct RustFS URL with TTL; P1+: signed URL endpoint)

#### Scenario: Standard error shape

- **WHEN** any import API returns an error (4xx / 5xx)
- **THEN** the response MUST contain `code: <error_code>`, `message: <human_readable>`, `traceId: <uuid>`, `timestamp: <unix_ms>`

#### Scenario: Upload error for too-large file

- **WHEN** a multipart upload exceeds 50MB
- **THEN** the system MUST return HTTP 413 (Payload Too Large) with error code `1001` and message "File size exceeds 50MB limit"

### Requirement: Knowledge Import Data Isolation

The system MUST enforce strict workspace isolation: every row in `knlg_document`, `knlg_import_job`, `knlg_parsed_chunk` MUST be scoped to one workspace via `workspace_id`, and cross-workspace queries MUST return 404.

#### Scenario: Cross-workspace access returns 404

- **WHEN** an authenticated user attempts to access a document / job / chunk from workspace `W1` while querying workspace `W2`
- **THEN** the system MUST return HTTP 404 with error code `1004`

#### Scenario: Document belongs to same workspace for job

- **WHEN** a user creates an import job with `document_id` referencing a document in another workspace
- **THEN** the system MUST return HTTP 404 with error code `1004` (not 400, to avoid information leakage)

### Requirement: P0 Out of Scope

The following sub-features are explicitly EXCLUDED from P0 scope and MUST NOT be implemented in P0:

- ❌ Actual document parsing (PDF/Word/MD content extraction) — P2
- ❌ Document classification (`decision_experience` / `general_knowledge` / `mixed`) — P2
- ❌ Signal extraction and confidence scoring — P2
- ❌ Candidate knowledge card generation from chunks — P2
- ❌ Candidate knowledge card review/approval flow — P2
- ❌ Auto-trigger of subsequent interviews based on document gaps — P2

#### Scenario: P0 does not auto-parse on upload

- **WHEN** a document is uploaded in P0
- **THEN** the system MUST NOT automatically start any parsing, classification, or signal extraction
- **AND** `knlg_import_job.status` MUST remain `'pending'` until P2 module is integrated

> **Note**: 解析任务留给 P2 文档解析器。P0 阶段只验证"上传链路 + 任务记录"端到端流程。
