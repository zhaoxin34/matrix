/**
 * Status API Client
 * Handles all status related API calls
 */

import type {
  Status,
  CreateStatusInput,
  UpdateStatusInput,
} from "@/components/status";
import type { ApiResponse } from "@/components/workspace/workspace-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================
// API Fetch Wrapper
// ============================================================
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const rawToken =
    typeof window !== "undefined" ? localStorage.getItem("neo-auth") : null;
  const parsed = rawToken ? JSON.parse(rawToken) : null;
  const token = parsed?.user?.token ?? parsed?.state?.user?.token ?? null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: "include",
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return { code: 0, message: "ok", data: null } as ApiResponse<T>;
  }

  const data = await response.json();

  if (!response.ok) {
    throw {
      code: data.code || response.status,
      message: data.message || "请求失败",
      detail: data.detail,
    };
  }

  if (data.code !== undefined && data.code !== 0) {
    throw {
      code: data.code,
      message: data.message || "请求失败",
      detail: data.detail,
    };
  }

  return data as ApiResponse<T>;
}

// ============================================================
// Status API
// ============================================================

export interface StatusListResponse {
  items: Status[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListStatusParams {
  page?: number;
  page_size?: number;
  entity_name?: string;
  source?: string;
  captured_start?: string;
  captured_end?: string;
  embedded_site_id?: number;
}

/**
 * List status records for a workspace
 * GET /api/v1/workspaces/{workspace_code}/status
 */
export async function listStatus(
  workspaceCode: string,
  params: ListStatusParams = {},
): Promise<{
  list: Status[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));
  if (params.entity_name) searchParams.set("entity_name", params.entity_name);
  if (params.source) searchParams.set("source", params.source);
  if (params.captured_start)
    searchParams.set("captured_start", params.captured_start);
  if (params.captured_end)
    searchParams.set("captured_end", params.captured_end);
  if (params.embedded_site_id)
    searchParams.set("embedded_site_id", String(params.embedded_site_id));

  const query = searchParams.toString();
  const response = await apiFetch<StatusListResponse>(
    `/api/v1/workspaces/${workspaceCode}/status${query ? `?${query}` : ""}`,
  );

  return {
    list: response.data?.items || [],
    total: response.data?.total || 0,
    page: response.data?.page || 1,
    page_size: response.data?.page_size || 20,
    total_pages: response.data?.total_pages || 0,
  };
}

/**
 * Get single status record
 * GET /api/v1/workspaces/{workspace_code}/status/{id}
 */
export async function getStatus(
  workspaceCode: string,
  statusId: number,
): Promise<Status> {
  const response = await apiFetch<Status>(
    `/api/v1/workspaces/${workspaceCode}/status/${statusId}`,
  );
  return response.data;
}

/**
 * Create status record
 * POST /api/v1/workspaces/{workspace_code}/status
 */
export async function createStatus(
  workspaceCode: string,
  data: CreateStatusInput,
): Promise<Status> {
  const response = await apiFetch<Status>(
    `/api/v1/workspaces/${workspaceCode}/status`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return response.data;
}

/**
 * Update status record
 * PUT /api/v1/workspaces/{workspace_code}/status/{id}
 */
export async function updateStatus(
  workspaceCode: string,
  statusId: number,
  data: UpdateStatusInput,
): Promise<Status> {
  const response = await apiFetch<Status>(
    `/api/v1/workspaces/${workspaceCode}/status/${statusId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  return response.data;
}

/**
 * Delete status record (hard delete)
 * DELETE /api/v1/workspaces/{workspace_code}/status/{id}
 */
export async function deleteStatus(
  workspaceCode: string,
  statusId: number,
): Promise<void> {
  await apiFetch<void>(
    `/api/v1/workspaces/${workspaceCode}/status/${statusId}`,
    {
      method: "DELETE",
    },
  );
}

// ============================================================
// Error Helper
// ============================================================
export function getErrorMessage(code: number): string {
  const messages: Record<number, string> = {
    0: "成功",
    1001: "参数错误",
    1002: "未授权",
    1003: "禁止访问",
    4101: "状态记录不存在",
    4102: "状态记录已存在",
    3001: "工作区不存在",
    3002: "工作区名称已存在",
    9001: "服务器内部错误",
  };
  return messages[code] || "请求失败，请稍后重试";
}
