# Agent Prototype Frontend Tasks

## 1. Setup & Dependencies

- [x] 1.1 Install required packages: react-markdown, remark-gfm, dompurify
- [x] 1.2 Add route to Sidebar.tsx for "Agent 原型" menu item
- [x] 1.3 Verify directory structure matches design: `app/(authenticated)/agent-prototypes/` and `components/agent-prototype/`

## 2. API Client

- [x] 2.1 Create `lib/agentPrototypeApi.ts` with all API methods
  - `list(params)`: GET /api/v1/agent-prototypes
  - `get(id)`: GET /api/v1/agent-prototypes/{id}
  - `create(data)`: POST /api/v1/agent-prototypes
  - `update(id, data)`: PUT /api/v1/agent-prototypes/{id}
  - `delete(id)`: DELETE /api/v1/agent-prototypes/{id}
  - `publish(id, data)`: POST /api/v1/agent-prototypes/{id}/publish
  - `rollback(id, data)`: POST /api/v1/agent-prototypes/{id}/rollback
  - `listVersions(id)`: GET /api/v1/agent-prototypes/{id}/versions

## 3. List Page

- [x] 3.1 Create `app/(authenticated)/agent-prototypes/page.tsx`
  - Display prototype list with pagination
  - Search input with `data-testid="inp-search-prototype"`
  - Status filter dropdown with `data-testid="sel-filter-status"`
  - "新建原型" button with `data-testid="btn-create-prototype"`
- [x] 3.2 Add row actions
  - "详情" button with `data-testid="btn-detail-{id}"`
  - "删除" button with `data-testid="btn-delete-{id}"` (only for draft)

## 4. Create Page

- [x] 4.1 Create `app/(authenticated)/agent-prototypes/new/page.tsx`
- [x] 4.2 Add form fields with data-testid:
  - Name input: `data-testid="inp-name"`
  - Description textarea: `data-testid="inp-description"`
  - Model input: `data-testid="inp-model"`
  - Temperature input: `data-testid="inp-temperature"`
  - Max Tokens input: `data-testid="inp-max-tokens"`
  - "创建" button: `data-testid="btn-submit"`
- [x] 4.3 Add AgentPrototypePrompts component for prompts editing

## 5. Detail Page

- [x] 5.1 Create `app/(authenticated)/agent-prototypes/[id]/page.tsx`
- [x] 5.2 Create Tab container with 3 tabs:
  - Basic Info tab (default)
  - Prompts tab
  - Versions tab
- [x] 5.3 Basic Info Tab content with `data-testid`:
  - Display all prototype fields
  - "编辑" button: `data-testid="btn-edit"`
  - "删除" button: `data-testid="btn-delete"` (only for draft)
  - "发布" button: `data-testid="btn-publish"` (only for draft)
  - "启用/禁用" button: `data-testid="btn-toggle-status"`

## 6. Edit Page

- [x] 6.1 Create `app/(authenticated)/agent-prototypes/[id]/edit/page.tsx`
- [x] 6.2 Reuse AgentPrototypeForm with existing data
- [x] 6.3 "保存" button: `data-testid="btn-submit"`
- [x] 6.4 "取消" button: `data-testid="btn-cancel"`

## 7. AgentPrototypeForm Component

- [x] 7.1 Create `components/agent-prototype/AgentPrototypeForm.tsx`
- [x] 7.2 Support both create and edit modes
- [x] 7.3 Include prompts editing section

## 8. Prompts Management

- [x] 8.1 Create `components/agent-prototype/AgentPrototypePrompts.tsx`
  - 6 type buttons: Soul, Memory, Reasoning, Agents, Workflow, Comm
  - Each button with `data-testid="btn-prompt-type-{type}"`
  - Display type description next to each tab
- [x] 8.2 Create `components/agent-prototype/MarkdownEditor.tsx`
  - Split view: textarea (left) + preview (right)
  - Textarea with `data-testid="md-editor-{type}"`
  - "保存" button: `data-testid="btn-save-prompt-{type}"`
- [x] 8.3 Integrate react-markdown + remark-gfm for preview
- [x] 8.4 Apply DOMPurify to prevent XSS

## 9. Versions Management

- [x] 9.1 Create `components/agent-prototype/AgentPrototypeVersions.tsx`
  - Display version list with `data-testid="version-list"`
  - Each row with version, change_summary, created_at
  - "回滚" button: `data-testid="btn-rollback-{version}"`
- [x] 9.2 Create `components/agent-prototype/RollbackDialog.tsx`
  - Confirm dialog with `data-testid="dlg-rollback"`
  - "确定" button: `data-testid="btn-confirm-rollback"`
  - "取消" button: `data-testid="btn-cancel-rollback"`

## 10. Dialogs

- [x] 10.1 Create `components/agent-prototype/PublishDialog.tsx`
  - Dialog with `data-testid="dlg-publish"`
  - Change summary textarea: `data-testid="inp-change-summary"`
  - "取消" button: `data-testid="btn-cancel-publish"`
  - "发布" button: `data-testid="btn-confirm-publish"`
- [x] 10.2 Create `components/agent-prototype/ConfirmDialog.tsx`
  - Reusable confirm dialog for delete and rollback

## 11. Sidebar Integration

- [x] 11.1 Add "Agent 原型" menu item in Sidebar.tsx
- [x] 11.2 Icon: SmartToy
- [x] 11.3 href: /agent-prototypes

## 12. Testing & Verification

- [x] 12.1 Run `pnpm run build` and verify no errors
- [x] 12.2 Verify all interactive elements have data-testid attributes
- [x] 12.3 Test page navigation flows:
  - List → Create → Detail → Edit
  - List → Detail → Prompts tab
  - List → Detail → Versions tab → Rollback
