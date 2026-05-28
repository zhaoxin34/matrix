/**
 * Workspace type definitions based on product design
 */

export type WorkspaceStatus = "active" | "disabled";

export type MemberRole = "owner" | "admin" | "member" | "guest";

export enum MemberRoleEnum {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
  GUEST = "guest",
}

export interface Workspace {
  id: number;
  name: string;
  code: string;
  description?: string;
  status: WorkspaceStatus;
  org_id: number;
  owner_id: number;
  member_count?: number;
  project_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  role: "owner" | "admin" | "member" | "guest";
  workspace_id: number;
  created_at: string;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  org_id?: number;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}

export interface WorkspaceListQuery {
  org_id?: number;
  status?: WorkspaceStatus;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: number;
}

export interface WorkspaceListResponse {
  list: Workspace[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Backend API response types (for API client)
 */
export interface MemberListItem {
  id: number;
  user_id: number;
  username: string | null;
  phone: string | null;
  role: MemberRoleEnum;
  joined_at: string;
}

export interface MemberListResponse {
  total: number;
  page: number;
  page_size: number;
  list: MemberListItem[];
}
