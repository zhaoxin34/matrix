/**
 * Agent type definitions
 * Matches backend Agent model
 */

export type AgentStatus = "enabled" | "disabled" | "deleted";

export interface Agent {
  id: number;
  name: string;
  description: string | null;
  prototype_id: number;
  prototype_version: string;
  workspace_id: number;
  model: string;
  skills: string[];
  config: Record<string, unknown>;
  status: AgentStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  prototype_id: number;
  prototype_version: string;
  model?: string;
  skills?: string[];
  config?: Record<string, unknown>;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  model?: string;
  skills?: string[];
  config?: Record<string, unknown>;
}

export interface AgentListResponse {
  items: Agent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
