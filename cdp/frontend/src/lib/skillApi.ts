import apiClient from "./api";

export type SkillLevel = "Planning" | "Functional" | "Atomic";
export type SkillStatus = "draft" | "active" | "disabled";

export interface Skill {
  id: number;
  code: string;
  name: string;
  level: SkillLevel;
  tags: string[] | null;
  author: string | null;
  content: string;
  version: string | null;
  status: SkillStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillCreate {
  code: string;
  name: string;
  level: SkillLevel;
  tags?: string[];
  author?: string;
  content?: string;
}

export interface SkillUpdate {
  name?: string;
  level?: SkillLevel;
  tags?: string[];
  author?: string;
  content?: string;
  status?: SkillStatus;
}

export interface SkillListResponse {
  items: Skill[];
  total: number;
  page: number;
  page_size: number;
}

export interface SkillVersion {
  id: number;
  skill_id: number;
  version: string;
  content: string;
  comment: string | null;
  created_at: string;
}

export interface PublishRequest {
  version: string;
  comment: string;
}

export interface RollbackRequest {
  version: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: number;
}

export const skillApi = {
  list: async (params?: {
    level?: SkillLevel;
    status?: SkillStatus;
    status_list?: string;
    keyword?: string;
    page?: number;
    page_size?: number;
  }): Promise<SkillListResponse> => {
    const response = await apiClient.get<ApiResponse<SkillListResponse>>(
      "/skills",
      { params },
    );
    return response.data.data;
  },

  get: async (code: string): Promise<Skill> => {
    const response = await apiClient.get<ApiResponse<Skill>>(`/skills/${code}`);
    return response.data.data;
  },

  create: async (data: SkillCreate): Promise<Skill> => {
    const response = await apiClient.post<ApiResponse<Skill>>("/skills", data);
    return response.data.data;
  },

  update: async (code: string, data: SkillUpdate): Promise<Skill> => {
    const response = await apiClient.put<ApiResponse<Skill>>(
      `/skills/${code}`,
      data,
    );
    return response.data.data;
  },

  delete: async (code: string): Promise<void> => {
    await apiClient.delete(`/skills/${code}`);
  },

  activate: async (code: string): Promise<void> => {
    await apiClient.patch(`/skills/${code}/activate`);
  },

  deactivate: async (code: string): Promise<void> => {
    await apiClient.patch(`/skills/${code}/deactivate`);
  },

  publish: async (code: string, data: PublishRequest): Promise<Skill> => {
    const response = await apiClient.post<ApiResponse<Skill>>(
      `/skills/${code}/publish`,
      data,
    );
    return response.data.data;
  },

  getVersions: async (code: string): Promise<SkillVersion[]> => {
    const response = await apiClient.get<ApiResponse<SkillVersion[]>>(
      `/skills/${code}/versions`,
    );
    return response.data.data;
  },

  rollback: async (code: string, data: RollbackRequest): Promise<Skill> => {
    const response = await apiClient.post<ApiResponse<Skill>>(
      `/skills/${code}/rollback`,
      data,
    );
    return response.data.data;
  },
};
