/**
 * Agent API client
 * Connects to backend API via frontend proxy: /api/v1/workspaces/{workspace_code}/agents
 */

import { getAuthHeaders } from "@/lib/utils/auth";

// API base URL - use relative path (Next.js API route will proxy)
const API_BASE = "";

// Types matching backend API
export type AgentStatus = "enabled" | "disabled" | "deleted";

/**
 * Reference to an enabled skill on an Agent.
 *
 * 与后端 AgentSkill 模型对齐：使用 `skill_id`（前端约定名），后端在
 * AgentUpdate / AgentCreate 时以 `id` 字段存取（见 backend/src/app/services/agent_service.py）。
 */
export interface AgentSkillRef {
  skill_id: number;
  version: string;
}

export interface AgentPrototypeInfo {
  id: number;
  code: string;
  name: string;
  version: string;
}

export interface AgentResponse {
  id: number;
  name: string;
  description: string | null;
  prototype_id: number;
  prototype_version: string;
  workspace_id: number;
  model: string;
  skills: AgentSkillRef[];
  config: Record<string, unknown>;
  status: AgentStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  prototype: AgentPrototypeInfo | null;
}

export interface AgentListResponse {
  items: AgentResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  prototype_id: number;
  prototype_version: string;
  model?: string;
  skills?: AgentSkillRef[];
  config?: Record<string, unknown>;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  model?: string;
  skills?: AgentSkillRef[];
  config?: Record<string, unknown>;
  prototype_version?: string;
}

export interface AgentStatusResponse {
  id: number;
  status: AgentStatus;
  updated_at: string;
}

// Error handling
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

// Helper function for API requests
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

// ==================== Agent API ====================

/**
 * List all agents in a workspace with pagination and filters
 */
export async function listAgents(
  workspaceCode: string,
  params?: {
    page?: number;
    page_size?: number;
    status?: string;
    prototype_id?: number;
    search?: string;
  },
): Promise<AgentListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.page_size)
    searchParams.set("page_size", params.page_size.toString());
  if (params?.status) searchParams.set("status", params.status);
  if (params?.prototype_id)
    searchParams.set("prototype_id", params.prototype_id.toString());
  if (params?.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();
  const endpoint = `/api/v1/workspaces/${workspaceCode}/agents${
    queryString ? `?${queryString}` : ""
  }`;

  return apiRequest<AgentListResponse>(endpoint);
}

/**
 * Get a single agent by ID
 */
export async function getAgent(
  workspaceCode: string,
  agentId: number,
): Promise<AgentResponse> {
  return apiRequest<AgentResponse>(
    `/api/v1/workspaces/${workspaceCode}/agents/${agentId}`,
  );
}

/**
 * Create a new agent
 */
export async function createAgent(
  workspaceCode: string,
  data: CreateAgentRequest,
): Promise<AgentResponse> {
  return apiRequest<AgentResponse>(
    `/api/v1/workspaces/${workspaceCode}/agents`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Update an agent
 */
export async function updateAgent(
  workspaceCode: string,
  agentId: number,
  data: UpdateAgentRequest,
): Promise<AgentResponse> {
  return apiRequest<AgentResponse>(
    `/api/v1/workspaces/${workspaceCode}/agents/${agentId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Delete an agent (soft delete)
 */
export async function deleteAgent(
  workspaceCode: string,
  agentId: number,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/api/v1/workspaces/${workspaceCode}/agents/${agentId}`,
    {
      method: "DELETE",
    },
  );
}

/**
 * Enable an agent
 */
export async function enableAgent(
  workspaceCode: string,
  agentId: number,
): Promise<AgentStatusResponse> {
  return apiRequest<AgentStatusResponse>(
    `/api/v1/workspaces/${workspaceCode}/agents/${agentId}/enable`,
    {
      method: "PATCH",
    },
  );
}

/**
 * Disable an agent
 */
export async function disableAgent(
  workspaceCode: string,
  agentId: number,
): Promise<AgentStatusResponse> {
  return apiRequest<AgentStatusResponse>(
    `/api/v1/workspaces/${workspaceCode}/agents/${agentId}/disable`,
    {
      method: "PATCH",
    },
  );
}
