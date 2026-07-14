/**
 * Agent Prototype API client
 * Connects to backend API via frontend proxy: /api/v1/agent_prototype
 */

import type {
  AgentPrototypeStatus,
  PromptConfig,
} from "@/components/agent-prototype/agent-prototype-types";
import { getAuthHeaders } from "@/lib/utils/auth";

// API base URL - use frontend proxy in production
const API_BASE = "/api/v1";

// Types matching backend API
// Agent type enum
export type AgentPrototypeType = "site_operation" | "expert_interview";

export interface AgentPrototypeResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  version: string | null;
  model: string; // Legacy field, kept for backward compatibility
  provider_id: number | null;
  model_id: string | null;
  llm_config: Record<string, unknown> | null;
  prompts: PromptConfig;
  config: Record<string, unknown>;
  status: AgentPrototypeStatus;
  type: AgentPrototypeType;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AgentPrototypeListResponse {
  items: AgentPrototypeResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface AgentPrototypeVersionResponse {
  id: number;
  version: string;
  change_summary: string | null;
  is_rollback: boolean;
  created_by: number;
  created_at: string;
}

export interface AgentPrototypeVersionListResponse {
  items: AgentPrototypeVersionResponse[];
  total: number;
}

export interface CreateAgentPrototypeRequest {
  name: string;
  code?: string;
  description?: string;
  model?: string; // Legacy field
  provider_id?: number;
  model_id?: string;
  llm_config?: Record<string, unknown>;
  prompts?: PromptConfig;
  config?: Record<string, unknown>;
  type?: AgentPrototypeType;
}

export interface UpdateAgentPrototypeRequest {
  name?: string;
  description?: string;
  model?: string; // Legacy field
  provider_id?: number;
  model_id?: string;
  llm_config?: Record<string, unknown>;
  prompts?: PromptConfig;
  config?: Record<string, unknown>;
  type?: AgentPrototypeType;
}

export interface PublishAgentPrototypeRequest {
  change_summary: string;
}

export interface RollbackAgentPrototypeRequest {
  target_version_id: number;
}

export interface UpdateStatusRequest {
  status: AgentPrototypeStatus;
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

// ==================== Agent Prototype API ====================

/**
 * List all agent prototypes with pagination and filters
 */
export async function listAgentPrototypes(params?: {
  page?: number;
  page_size?: number;
  status?: AgentPrototypeStatus | "all";
  search?: string;
}): Promise<AgentPrototypeListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.page_size)
    searchParams.set("page_size", params.page_size.toString());
  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params?.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();
  const endpoint = `/agent_prototype${queryString ? `?${queryString}` : ""}`;

  return apiRequest<AgentPrototypeListResponse>(endpoint);
}

/**
 * Get a single agent prototype by ID
 */
export async function getAgentPrototype(
  prototypeId: number,
): Promise<AgentPrototypeResponse> {
  return apiRequest<AgentPrototypeResponse>(`/agent_prototype/${prototypeId}`);
}

/**
 * Create a new agent prototype
 */
export async function createAgentPrototype(
  data: CreateAgentPrototypeRequest,
): Promise<AgentPrototypeResponse> {
  return apiRequest<AgentPrototypeResponse>("/agent_prototype", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an agent prototype
 */
export async function updateAgentPrototype(
  prototypeId: number,
  data: UpdateAgentPrototypeRequest,
): Promise<AgentPrototypeResponse> {
  return apiRequest<AgentPrototypeResponse>(`/agent_prototype/${prototypeId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete an agent prototype (only draft status allowed)
 */
export async function deleteAgentPrototype(
  prototypeId: number,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/agent_prototype/${prototypeId}`, {
    method: "DELETE",
  });
}

/**
 * Publish an agent prototype with a new version
 */
export async function publishAgentPrototype(
  prototypeId: number,
  data: PublishAgentPrototypeRequest,
): Promise<AgentPrototypeResponse> {
  return apiRequest<AgentPrototypeResponse>(
    `/agent_prototype/${prototypeId}/publish`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Get next version number for a prototype
 */
export async function getNextVersion(
  prototypeId: number,
): Promise<{ next_version: string }> {
  return apiRequest<{ next_version: string }>(
    `/agent_prototype/next-version/${prototypeId}`,
  );
}

/**
 * Get version history for a prototype
 */
export async function getVersionHistory(
  prototypeId: number,
): Promise<AgentPrototypeVersionListResponse> {
  return apiRequest<AgentPrototypeVersionListResponse>(
    `/agent_prototype/${prototypeId}/versions`,
  );
}

/**
 * Rollback to a specific version
 */
export async function rollbackAgentPrototype(
  prototypeId: number,
  data: RollbackAgentPrototypeRequest,
): Promise<AgentPrototypeResponse> {
  return apiRequest<AgentPrototypeResponse>(
    `/agent_prototype/${prototypeId}/rollback`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * Update agent prototype status (enable/disable)
 */
export async function updateAgentPrototypeStatus(
  prototypeId: number,
  data: UpdateStatusRequest,
): Promise<AgentPrototypeResponse> {
  return apiRequest<AgentPrototypeResponse>(
    `/agent_prototype/${prototypeId}/status`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}
