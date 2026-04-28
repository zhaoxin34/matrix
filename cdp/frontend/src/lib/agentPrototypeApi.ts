import apiClient from "./api";

export interface PromptsField {
  soul?: string;
  memory?: string;
  reasoning?: string;
  agents?: string;
  workflow?: string;
  communication?: string;
}

export interface AgentPrototype {
  id: number;
  name: string;
  description?: string;
  version: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  prompts: PromptsField;
  status: "draft" | "enabled" | "disabled";
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number;
}

export interface CreateAgentPrototypeRequest {
  name: string;
  description?: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  prompts?: PromptsField;
}

export interface UpdateAgentPrototypeRequest {
  name?: string;
  description?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  prompts?: PromptsField;
}

export interface PublishRequest {
  version?: string;
  change_summary?: string;
}

export interface RollbackRequest {
  version: string;
}

export interface VersionResponse {
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
  change_summary?: string;
  created_at: string;
  created_by: number;
}

interface ListParams {
  page?: number;
  page_size?: number;
  status?: string;
  keyword?: string;
}

interface ListResponse {
  items: AgentPrototype[];
  total: number;
  page: number;
  page_size: number;
}

export const agentPrototypeApi = {
  list: async (params: ListParams = {}): Promise<ListResponse> => {
    const { page = 1, page_size = 20, status, keyword } = params;
    const query = new URLSearchParams({ page: String(page), page_size: String(page_size) });
    if (status) query.set("status", status);
    if (keyword) query.set("keyword", keyword);
    const response = await apiClient.get<ListResponse>(`/agent-prototypes/?${query.toString()}`);
    return response.data;
  },

  get: async (id: number): Promise<AgentPrototype> => {
    const response = await apiClient.get<AgentPrototype>(`/agent-prototypes/${id}`);
    return response.data;
  },

  create: async (data: CreateAgentPrototypeRequest): Promise<AgentPrototype> => {
    const response = await apiClient.post<AgentPrototype>("/agent-prototypes/", data);
    return response.data;
  },

  update: async (id: number, data: UpdateAgentPrototypeRequest): Promise<AgentPrototype> => {
    const response = await apiClient.put<AgentPrototype>(`/agent-prototypes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/agent-prototypes/${id}`);
  },

  publish: async (id: number, data: PublishRequest): Promise<AgentPrototype> => {
    const response = await apiClient.post<AgentPrototype>(`/agent-prototypes/${id}/publish`, data);
    return response.data;
  },

  rollback: async (id: number, data: RollbackRequest): Promise<AgentPrototype> => {
    const response = await apiClient.post<AgentPrototype>(`/agent-prototypes/${id}/rollback`, data);
    return response.data;
  },

  listVersions: async (id: number): Promise<VersionResponse[]> => {
    const response = await apiClient.get<VersionResponse[]>(`/agent-prototypes/${id}/versions`);
    return response.data;
  },

  toggleStatus: async (id: number): Promise<AgentPrototype> => {
    const response = await apiClient.post<AgentPrototype>(`/agent-prototypes/${id}/toggle-status`);
    return response.data;
  },
};
