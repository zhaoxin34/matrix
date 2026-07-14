# agent-mapping Specification

## Purpose

定义 Workspace 内 `(type → agent_id)` 映射的完整 CRUD 能力，为下游消费者（如 ai-interview-agent）提供"该 type 应使用哪个 Agent 实例"的单一权威来源（single source of truth）。

## ADDED Requirements

### Requirement: Agent 映射唯一性约束

The system MUST enforce that within a single workspace, each `type` value maps to at most one Agent.

The system MUST persist this constraint at the database level via a `UNIQUE KEY (workspace_id, type)` index.

#### Scenario: 同一 workspace 重复 type 创建

- **WHEN** 客户端 `POST /api/v1/workspaces/{workspace_code}/agent-mappings` with a `type` that already exists in the workspace
- **THEN** the system MUST return HTTP 409 with a message indicating the type is already mapped
- **AND** MUST NOT create a duplicate mapping

#### Scenario: 不同 workspace 同名 type 互不干扰

- **WHEN** workspace A has mapping `(type='expert_interview' → agent_1)`
- **AND** workspace B creates a new mapping with `type='expert_interview' → agent_2`
- **THEN** the system MUST accept workspace B's mapping (no cross-workspace conflict)

### Requirement: 列出 workspace 的所有映射

The system MUST allow authorized users to list all agent mappings for a given workspace.

The endpoint MUST return mappings ordered by `created_at DESC` (newest first).

#### Scenario: 列出映射成功

- **WHEN** an authenticated user calls `GET /api/v1/workspaces/{workspace_code}/agent-mappings`
- **THEN** the system MUST return HTTP 200 with a paginated list of all mappings in the workspace
- **AND** MUST include `id`, `workspace_id`, `type`, `agent_id`, `created_at`, `updated_at` for each mapping

#### Scenario: workspace 不存在

- **WHEN** the `workspace_code` does not exist
- **THEN** the system MUST return HTTP 404 with detail "Workspace not found"

### Requirement: 按 type 查询单个映射

The system MUST allow clients to retrieve a single mapping by `type` within a workspace.

#### Scenario: 查询存在的映射

- **WHEN** an authenticated user calls `GET /api/v1/workspaces/{workspace_code}/agent-mappings/{type}`
- **AND** a mapping with that `type` exists in the workspace
- **THEN** the system MUST return HTTP 200 with the mapping details

#### Scenario: 查询不存在的映射

- **WHEN** no mapping exists with the given `type` in the workspace
- **THEN** the system MUST return HTTP 404 with detail "Agent mapping not found"

### Requirement: 创建新映射

The system MUST allow authorized users to create a new `(type → agent_id)` mapping within a workspace.

The system MUST validate:

- `type` is non-empty, 1-32 characters, matches pattern `^[a-z][a-z0-9_]*$`
- `agent_id` exists in the agents table
- `agent.workspace_id` matches the target workspace

#### Scenario: 成功创建映射

- **WHEN** an authenticated user calls `POST /api/v1/workspaces/{workspace_code}/agent-mappings` with valid `type` and `agent_id`
- **AND** the `(workspace_id, type)` pair does not yet exist
- **AND** the agent exists and belongs to the same workspace
- **THEN** the system MUST return HTTP 201 with the created mapping
- **AND** MUST set `created_at` and `updated_at` to the current time

#### Scenario: agent 不存在

- **WHEN** the request `agent_id` does not exist in the agents table
- **THEN** the system MUST return HTTP 404 with detail indicating the agent was not found

#### Scenario: agent 跨 workspace

- **WHEN** the request `agent_id` belongs to a different workspace
- **THEN** the system MUST return HTTP 404 (do not leak workspace boundaries)

#### Scenario: type 格式非法

- **WHEN** the request `type` does not match `^[a-z][a-z0-9_]*$` or exceeds 32 characters
- **THEN** the system MUST return HTTP 400 with validation error

### Requirement: 更新映射的 agent

The system MUST allow authorized users to update the `agent_id` of an existing mapping.

The system MUST NOT allow updating `type`, `workspace_id`, or `id` after creation (immutable).

#### Scenario: 成功更新 agent_id

- **WHEN** an authenticated user calls `PUT /api/v1/workspaces/{workspace_code}/agent-mappings/{type}` with a new `agent_id`
- **AND** a mapping with that `type` exists
- **AND** the new `agent_id` exists and belongs to the same workspace
- **THEN** the system MUST return HTTP 200 with the updated mapping
- **AND** MUST update `updated_at` to the current time

#### Scenario: 更新不存在的映射

- **WHEN** no mapping exists with the given `type`
- **THEN** the system MUST return HTTP 404 with detail "Agent mapping not found"

#### Scenario: 新 agent 跨 workspace

- **WHEN** the new `agent_id` belongs to a different workspace
- **THEN** the system MUST return HTTP 404

### Requirement: 删除映射

The system MUST allow authorized users to delete a mapping by `type`.

#### Scenario: 成功删除

- **WHEN** an authenticated user calls `DELETE /api/v1/workspaces/{workspace_code}/agent-mappings/{type}`
- **AND** the mapping exists
- **THEN** the system MUST return HTTP 200 with success (or HTTP 204)
- **AND** the mapping MUST be removed from the database

#### Scenario: 删除不存在的映射

- **WHEN** no mapping exists with the given `type`
- **THEN** the system MUST return HTTP 404 with detail "Agent mapping not found"

### Requirement: 鉴权

The system MUST require authentication for all agent mapping endpoints.

#### Scenario: 未鉴权访问

- **WHEN** an unauthenticated client calls any agent mapping endpoint
- **THEN** the system MUST return HTTP 401
