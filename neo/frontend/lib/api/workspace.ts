/**
 * Workspace API Client
 * Handles all workspace related API calls
 */

import type {
  ApiResponse,
  Workspace,
  WorkspaceListResponse,
  WorkspaceMember,
  MemberListResponse,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceListQuery,
  WorkspaceStatus,
} from "@/components/workspace/workspace-types";
import type { MemberRoleEnum } from "@/components/workspace/workspace-types";

// Re-export types for convenience
export type {
  Workspace,
  WorkspaceMember,
  WorkspaceStatus,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/components/workspace/workspace-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================
// API Fetch Wrapper
// ============================================================
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // Get auth token from store
  const rawToken =
    typeof window !== "undefined" ? localStorage.getItem("neo-auth") : null;
  const parsed = rawToken ? JSON.parse(rawToken) : null;
  const token = parsed?.state?.user?.token ?? null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    const error = {
      code: data.code || response.status,
      message: data.message || "请求失败",
      detail: data.detail,
    };
    throw error;
  }

  // Check if the API returned an error in the response body
  if (data.code !== 0) {
    const error = {
      code: data.code,
      message: data.message || "请求失败",
      detail: data.detail,
    };
    throw error;
  }

  return data as ApiResponse<T>;
}

// ============================================================
// Workspace API
// ============================================================

/**
 * Get workspace by ID
 * GET /api/v1/workspaces/{workspace_id}
 */
export async function getWorkspace(
  workspaceId: number,
): Promise<Workspace | null> {
  try {
    const response = await apiFetch<Workspace>(
      `/api/v1/workspaces/${workspaceId}`,
    );
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Get workspace by code
 * GET /api/v1/workspaces/code/{code}
 */
export async function getWorkspaceByCode(
  code: string,
): Promise<Workspace | null> {
  try {
    const response = await apiFetch<Workspace>(
      `/api/v1/workspaces/code/${code}`,
    );
    return response.data;
  } catch {
    return null;
  }
}

/**
 * List workspaces
 * GET /api/v1/workspaces
 */
export async function getWorkspaceList(
  params: WorkspaceListQuery = {},
): Promise<{
  list: Workspace[];
  total: number;
  page: number;
  page_size: number;
}> {
  const searchParams = new URLSearchParams();
  if (params.org_id) searchParams.set("org_id", String(params.org_id));
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  const response = await apiFetch<WorkspaceListResponse>(
    `/api/v1/workspaces${query ? `?${query}` : ""}`,
  );
  return {
    list: response.data?.list || [],
    total: response.data?.total || 0,
    page: response.data?.page || 1,
    page_size: response.data?.page_size || 20,
  };
}

/**
 * Get current user's workspaces
 * GET /api/v1/workspaces/my
 */
export async function getMyWorkspaces(
  params: Omit<WorkspaceListQuery, "status"> & {
    status?: WorkspaceStatus;
  } = {},
): Promise<{
  list: Workspace[];
  total: number;
  page: number;
  page_size: number;
}> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  const response = await apiFetch<WorkspaceListResponse>(
    `/api/v1/workspaces/my${query ? `?${query}` : ""}`,
  );
  return {
    list: response.data?.list || [],
    total: response.data?.total || 0,
    page: response.data?.page || 1,
    page_size: response.data?.page_size || 20,
  };
}

/**
 * Create workspace
 * POST /api/v1/workspaces
 */
export async function createWorkspace(
  data: CreateWorkspaceInput,
): Promise<Workspace> {
  const response = await apiFetch<Workspace>("/api/v1/workspaces", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Update workspace
 * PATCH /api/v1/workspaces/{workspace_id}
 */
export async function updateWorkspace(
  workspaceId: number,
  data: UpdateWorkspaceInput,
): Promise<Workspace> {
  const response = await apiFetch<Workspace>(
    `/api/v1/workspaces/${workspaceId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
  return response.data;
}

/**
 * Disable workspace
 * POST /api/v1/workspaces/{workspace_id}/disable
 */
export async function disableWorkspace(
  workspaceId: number,
): Promise<Workspace> {
  const response = await apiFetch<Workspace>(
    `/api/v1/workspaces/${workspaceId}/disable`,
    {
      method: "POST",
    },
  );
  return response.data;
}

/**
 * Enable workspace
 * POST /api/v1/workspaces/{workspace_id}/enable
 */
export async function enableWorkspace(workspaceId: number): Promise<Workspace> {
  const response = await apiFetch<Workspace>(
    `/api/v1/workspaces/${workspaceId}/enable`,
    {
      method: "POST",
    },
  );
  return response.data;
}

/**
 * Check workspace access
 * GET /api/v1/workspaces/{workspace_id}/check-access
 */
export async function checkWorkspaceAccess(workspaceId: number): Promise<{
  workspace_id: number;
  user_id: number;
  is_member: boolean;
  is_owner: boolean;
  role: string | null;
} | null> {
  try {
    const response = await apiFetch<{
      workspace_id: number;
      user_id: number;
      is_member: boolean;
      is_owner: boolean;
      role: string | null;
    }>(`/api/v1/workspaces/${workspaceId}/check-access`);
    return response.data;
  } catch {
    return null;
  }
}

// ============================================================
// Workspace Member API
// ============================================================

/**
 * Get workspace members
 * GET /api/v1/workspaces/{workspace_id}/members
 */
export async function getWorkspaceMembers(
  workspaceId: number,
  params: {
    role?: string;
    page?: number;
    page_size?: number;
  } = {},
): Promise<{
  list: WorkspaceMember[];
  total: number;
  page: number;
  page_size: number;
}> {
  const searchParams = new URLSearchParams();
  if (params.role) searchParams.set("role", params.role);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));

  const query = searchParams.toString();
  const response = await apiFetch<MemberListResponse>(
    `/api/v1/workspaces/${workspaceId}/members${query ? `?${query}` : ""}`,
  );

  // Transform backend response to frontend format
  const list = (response.data?.list || []).map((member) => ({
    id: member.id,
    user_id: member.user_id,
    user_name: member.username || "",
    user_email: member.phone || "",
    user_avatar: undefined,
    role: member.role as WorkspaceMember["role"],
    workspace_id: workspaceId,
    created_at: member.joined_at,
  }));

  return {
    list,
    total: response.data?.total || 0,
    page: response.data?.page || 1,
    page_size: response.data?.page_size || 20,
  };
}

/**
 * Add workspace member
 * POST /api/v1/workspaces/{workspace_id}/members
 */
export async function addWorkspaceMember(
  workspaceId: number,
  userId: number,
  role: string,
): Promise<WorkspaceMember> {
  const response = await apiFetch<{
    id: number;
    workspace_id: number;
    user_id: number;
    role: MemberRoleEnum;
    created_at: string;
    updated_at: string;
    username: string | null;
    phone: string | null;
  }>(`/api/v1/workspaces/${workspaceId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role }),
  });

  return {
    id: response.data.id,
    user_id: response.data.user_id,
    user_name: response.data.username || "",
    user_email: response.data.phone || "",
    user_avatar: undefined,
    role: response.data.role as WorkspaceMember["role"],
    workspace_id: response.data.workspace_id,
    created_at: response.data.created_at,
  };
}

/**
 * Update workspace member role
 * PATCH /api/v1/workspaces/{workspace_id}/members/{member_id}
 */
export async function updateWorkspaceMember(
  workspaceId: number,
  memberId: number,
  role: string,
): Promise<WorkspaceMember> {
  const response = await apiFetch<{
    id: number;
    workspace_id: number;
    user_id: number;
    role: MemberRoleEnum;
    created_at: string;
    updated_at: string;
    username: string | null;
    phone: string | null;
  }>(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

  return {
    id: response.data.id,
    user_id: response.data.user_id,
    user_name: response.data.username || "",
    user_email: response.data.phone || "",
    user_avatar: undefined,
    role: response.data.role as WorkspaceMember["role"],
    workspace_id: response.data.workspace_id,
    created_at: response.data.created_at,
  };
}

/**
 * Remove workspace member
 * DELETE /api/v1/workspaces/{workspace_id}/members/{member_id}
 */
export async function removeWorkspaceMember(
  workspaceId: number,
  memberId: number,
): Promise<void> {
  await apiFetch<void>(
    `/api/v1/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: "DELETE",
    },
  );
}

/**
 * Transfer workspace ownership
 * POST /api/v1/workspaces/{workspace_id}/transfer-owner
 */
export async function transferWorkspaceOwnership(
  workspaceId: number,
  newOwnerId: number,
): Promise<Workspace> {
  const response = await apiFetch<Workspace>(
    `/api/v1/workspaces/${workspaceId}/transfer-owner`,
    {
      method: "POST",
      body: JSON.stringify({ new_owner_id: newOwnerId }),
    },
  );
  return response.data;
}

// ============================================================
// Error Helper
// ============================================================
export function getErrorMessage(code: number): string {
  const messages: Record<number, string> = {
    0: "成功",
    1001: "参数错误",
    1002: "未授权",
    2001: "工作区不存在",
    2002: "工作区名称已存在",
    2003: "工作区已禁用",
    2004: "无权限访问此工作区",
    2005: "仅工作区所有者可以执行此操作",
    2006: "无法转移所有权给自己",
    2007: "用户不存在",
    2008: "用户已是工作区成员",
    2009: "无法修改所有者角色",
    2010: "无法移除工作区所有者",
    9001: "服务器内部错误",
  };
  return messages[code] || "请求失败，请稍后重试";
}
