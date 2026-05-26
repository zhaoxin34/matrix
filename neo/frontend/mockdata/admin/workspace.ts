// ============================================================
// Types
// ============================================================
import type { WorkspaceStatus } from "@/components/workspace/workspace-types";
import type { Workspace as WorkspaceBase } from "@/components/workspace/workspace-types";

// Re-export for convenience
export type { WorkspaceStatus };
export type Workspace = WorkspaceBase;

// ============================================================
// Workspaces List
// ============================================================
export const mockWorkspaces: Workspace[] = [
  {
    id: 1,
    name: "CRM 工作区",
    code: "crm-workspace",
    description: "客户关系管理团队的工作区",
    status: "active",
    org_id: 1,
    owner_id: 1,
    member_count: 15,
    project_count: 8,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-12T15:30:00Z",
  },
  {
    id: 2,
    name: "运营工作区",
    code: "ops-workspace",
    description: "运营团队的工作区，负责日常运营任务",
    status: "active",
    org_id: 1,
    owner_id: 1,
    member_count: 8,
    project_count: 5,
    created_at: "2026-04-15T08:00:00Z",
    updated_at: "2026-05-10T12:00:00Z",
  },
  {
    id: 3,
    name: "已禁用工作区",
    code: "disabled-workspace",
    description: "这是一个已禁用的工作区示例",
    status: "disabled",
    org_id: 1,
    owner_id: 1,
    member_count: 3,
    project_count: 1,
    created_at: "2026-03-20T09:00:00Z",
    updated_at: "2026-05-08T18:00:00Z",
  },
];

// ============================================================
// Workspace Settings (detail view)
// ============================================================
export const mockWorkspaceSettings = {
  id: 1,
  name: "CRM 工作区",
  code: "crm-workspace",
  description: "客户关系管理团队的工作区",
  status: "active" as WorkspaceStatus,
  org_id: 1,
  owner_id: 1,
  member_count: 15,
  project_count: 8,
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-12T15:30:00Z",
};
