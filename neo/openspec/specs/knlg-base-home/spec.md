# knlg-base-home

## Purpose

TBD — knlg-base home page that provides navigation entry points to the four sub-modules (QA Library, Knowledge Base, Rule Library, Knowledge Import).

## Requirements

### Requirement: knlg-base Home Page (P0 Navigation Only)

The system SHALL provide a home page for the knlg-base module at `/workspace/{workspace_code}/knlg-base`. In P0 phase, the home page MUST display navigation entries for the four sub-modules (QA Library, Knowledge Base, Rule Library, Knowledge Import), and MUST NOT display real-time statistics or analytics aggregations.

#### Scenario: Render home page navigation

- **WHEN** an authenticated user navigates to `/workspace/{workspace_code}/knlg-base` in workspace `W`
- **THEN** the system MUST display a home page containing 4 navigation cards:
  - **问答库 (QA Library)** → links to `/workspace/{code}/knlg-base/qa`
  - **知识库 (Knowledge Base)** → links to `/workspace/{code}/knlg-base/knowledge`
  - **规则库 (Rule Library)** → links to `/workspace/{code}/knlg-base/rules`
  - **知识导入 (Knowledge Import)** → links to `/workspace/{code}/knlg-base/import`

#### Scenario: All four sub-modules accessible from home

- **WHEN** a user clicks any of the 4 navigation cards
- **THEN** the system MUST navigate to the corresponding sub-module page
- **AND** all 4 links MUST be visible to `guest` users (read-only access)

#### Scenario: Home page does not fetch real stats in P0

- **WHEN** the home page renders
- **THEN** the system MUST NOT make any backend API calls for statistics aggregation (e.g., total questions, total cards, total rules)
- **AND** the system MUST NOT show counts, charts, or recent activity feeds

> **Note**：P0 阶段首页仅展示 4 个子模块的入口导航卡片，不做任何数据统计聚合。统计功能推到 P1+。

### Requirement: Home Page Permission

The system MUST allow all roles (Owner / Admin / Member / Guest) to view the home page. Sub-module entries MUST link to read-only pages for Guest users; write operations within sub-modules MUST be controlled by sub-module permissions.

#### Scenario: All roles can view home

- **WHEN** an authenticated user with any role (Owner / Admin / Member / Guest) in workspace `W` navigates to the home page
- **THEN** the system MUST render the home page successfully (HTTP 200)

#### Scenario: Home page is workspace-scoped

- **WHEN** an authenticated user requests the home page with `workspace_code` in the URL
- **THEN** the system MUST verify the user has access to that workspace (existing pattern from agents / interceptors modules)
- **AND** if the user has no access, the system MUST return HTTP 403 (consistent with existing modules)

### Requirement: Home Page API Contract

In P0, the home page is a pure client-side rendering without backend API calls. The system MUST NOT expose a `/home` endpoint for stats aggregation.

#### Scenario: No home stats endpoint

- **WHEN** a client attempts `GET /api/v1/workspaces/W/knlg-base/home/stats`
- **THEN** the system MUST return HTTP 404 (endpoint does not exist in P0)

#### Scenario: Future stats endpoint (P1+ reserved)

- **WHEN** P1+ introduces the stats endpoint, it MUST conform to the Neo platform API response format `{code, message, data, traceId, timestamp}`
- **AND** the stats payload MUST include: `total_questions`, `total_interviews`, `total_knowledge_cards`, `total_rules`, `recent_activity_count`

> **Note**: 这是预留的 P1+ 规格要求，不在 P0 实现范围。

### Requirement: Home Page Out of Scope

The following home page features are EXCLUDED from P0 scope and MUST NOT be implemented in P0:

- ❌ Real-time statistics aggregation (total questions, cards, rules, etc.)
- ❌ Recent activity feed (latest interviews, latest created cards)
- ❌ Quick action buttons (e.g., "New Question", "Upload Document")
- ❌ Onboarding wizard for new workspaces
- ❌ Workspace-level configuration (knlg-base enabled/disabled toggle, LLM provider override)

#### Scenario: P0 home is intentionally minimal

- **WHEN** the home page is rendered
- **THEN** the page MUST be a thin client-side component that ONLY renders 4 navigation cards
- **AND** the page MUST NOT trigger any backend data fetching on mount (except auth check)
