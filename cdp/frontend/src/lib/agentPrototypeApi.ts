/** Agent Prototype API client */

import apiClient from "./api";

export type AgentPrototypeStatus = "draft" | "enabled" | "disabled";

export interface PromptsField {
  soul: string;
  memory: string;
  reasoning: string;
  agents: string;
  workflow: string;
  communication: string;
}

export interface AgentPrototype {
  id: number;
  name: string;
  description: string | null;
  version: string;
  model: string;
  temperature: number;
  max_tokens: number;
  prompts: PromptsField;
  status: AgentPrototypeStatus;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number | null;
}

export interface AgentPrototypeVersion {
  id: number;
  prototype_id: number;
  version: string;
  prompts_snapshot: PromptsField;
  config_snapshot: {
    model: string;
    temperature: number;
    max_tokens: number;
    status: string;
  };
  change_summary: string | null;
  created_at: string;
  created_by: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateAgentPrototypeDto {
  name: string;
  description?: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  prompts?: PromptsField;
}

export interface UpdateAgentPrototypeDto {
  name?: string;
  description?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  prompts?: PromptsField;
}

export interface PublishDto {
  version: string;
  change_summary?: string;
}

export interface RollbackDto {
  version: string;
}

export const agentPrototypeApi = {
  list: async (params?: {
    status?: string;
    keyword?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AgentPrototype>> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.keyword) searchParams.set("keyword", params.keyword);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    const response = await apiClient.get(`/agent-prototypes?${searchParams}`);
    return response.data.data;
  },

  get: async (id: number): Promise<AgentPrototype> => {
    const response = await apiClient.get(`/agent-prototypes/${id}`);
    return response.data.data;
  },

  create: async (data: CreateAgentPrototypeDto): Promise<AgentPrototype> => {
    const response = await apiClient.post("/agent-prototypes", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateAgentPrototypeDto): Promise<AgentPrototype> => {
    const response = await apiClient.put(`/agent-prototypes/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/agent-prototypes/${id}`);
  },

  publish: async (id: number, data: PublishDto): Promise<AgentPrototype> => {
    const response = await apiClient.post(`/agent-prototypes/${id}/publish`, data);
    return response.data.data;
  },

  rollback: async (id: number, data: RollbackDto): Promise<AgentPrototype> => {
    const response = await apiClient.post(`/agent-prototypes/${id}/rollback`, data);
    return response.data.data;
  },

  toggleStatus: async (id: number): Promise<AgentPrototype> => {
    const response = await apiClient.post(`/agent-prototypes/${id}/toggle-status`);
    return response.data.data;
  },

  listVersions: async (id: number): Promise<AgentPrototypeVersion[]> => {
    const response = await apiClient.get(`/agent-prototypes/${id}/versions`);
    return response.data.data;
  },
};