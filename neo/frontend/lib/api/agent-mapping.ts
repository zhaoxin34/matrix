/**
 * Agent Mapping API client
 *
 * Connects to backend API:
 *   GET    /api/v1/workspaces/{ws}/agent-mappings
 *   GET    /api/v1/workspaces/{ws}/agent-mappings/{type}
 *   POST   /api/v1/workspaces/{ws}/agent-mappings
 *   PUT    /api/v1/workspaces/{ws}/agent-mappings/{type}
 *   DELETE /api/v1/workspaces/{ws}/agent-mappings/{type}
 */

import { getAuthHeaders } from "@/lib/utils/auth";

const API_BASE = "";

// ============ Types ============

export interface AgentMapping {
  id: number;
  workspace_id: number;
  type: string;
  agent_id: number;
  created_at: string;
  updated_at: string;
}

export interface AgentMappingListResponse {
  items: AgentMapping[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateAgentMappingRequest {
  type: string;
  agent_id: number;
}

export interface UpdateAgentMappingRequest {
  agent_id: number;
}

// ============ Error handling ============

export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const authHeaders = getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || "Request failed",
      data.code || response.status,
      response.status,
    );
  }

  if (data.code !== 0) {
    throw new ApiError(data.message, data.code, 200);
  }

  return data.data as T;
}

// ============ API functions ============

/** List all mappings in a workspace. */
export async function listAgentMappings(
  workspaceCode: string,
  params?: { page?: number; page_size?: number },
): Promise<AgentMappingListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.page_size)
    searchParams.set("page_size", params.page_size.toString());

  const qs = searchParams.toString();
  return apiRequest<AgentMappingListResponse>(
    `/api/v1/workspaces/${workspaceCode}/agent-mappings${qs ? `?${qs}` : ""}`,
  );
}

/** Get a single mapping by its `type` within the workspace. */
export async function getAgentMapping(
  workspaceCode: string,
  type: string,
): Promise<AgentMapping> {
  return apiRequest<AgentMapping>(
    `/api/v1/workspaces/${workspaceCode}/agent-mappings/${type}`,
  );
}

/** Create a new (type -> agent_id) mapping. */
export async function createAgentMapping(
  workspaceCode: string,
  data: CreateAgentMappingRequest,
): Promise<AgentMapping> {
  return apiRequest<AgentMapping>(
    `/api/v1/workspaces/${workspaceCode}/agent-mappings`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/** Update the agent_id of an existing mapping (type is immutable). */
export async function updateAgentMapping(
  workspaceCode: string,
  type: string,
  data: UpdateAgentMappingRequest,
): Promise<AgentMapping> {
  return apiRequest<AgentMapping>(
    `/api/v1/workspaces/${workspaceCode}/agent-mappings/${type}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

/** Delete a mapping by its `type`. */
export async function deleteAgentMapping(
  workspaceCode: string,
  type: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/api/v1/workspaces/${workspaceCode}/agent-mappings/${type}`,
    {
      method: "DELETE",
    },
  );
}
