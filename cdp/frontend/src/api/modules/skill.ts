import apiClient from "../axios";
import type { ApiResponse } from "../types";
import type {
  Skill,
  SkillCreate,
  SkillListResponse,
  SkillUpdate,
} from "@/types/skill";

export interface SkillListParams {
  level?: string;
  tags?: string;
  is_active?: boolean;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export const skillApi = {
  list: async (params: SkillListParams = {}): Promise<SkillListResponse> => {
    const res = await apiClient.get<ApiResponse<SkillListResponse>>("/skills", {
      params,
    });
    return res.data.data!;
  },

  getByCode: async (code: string): Promise<Skill> => {
    const res = await apiClient.get<ApiResponse<Skill>>(`/skills/${code}`);
    return res.data.data!;
  },

  create: async (data: SkillCreate): Promise<Skill> => {
    const res = await apiClient.post<ApiResponse<Skill>>("/skills", data);
    return res.data.data!;
  },

  update: async (code: string, data: SkillUpdate): Promise<Skill> => {
    const res = await apiClient.put<ApiResponse<Skill>>(
      `/skills/${code}`,
      data,
    );
    return res.data.data!;
  },

  delete: async (code: string): Promise<void> => {
    await apiClient.delete(`/skills/${code}`);
  },

  activate: async (code: string): Promise<Skill> => {
    const res = await apiClient.patch<ApiResponse<Skill>>(
      `/skills/${code}/activate`,
    );
    return res.data.data!;
  },

  deactivate: async (code: string): Promise<Skill> => {
    const res = await apiClient.patch<ApiResponse<Skill>>(
      `/skills/${code}/deactivate`,
    );
    return res.data.data!;
  },
};
