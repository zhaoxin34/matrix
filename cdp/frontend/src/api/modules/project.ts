import apiClient from "../axios";
import type { ApiResponse } from "../types";

export interface Project {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  code: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: "active" | "inactive" | "archived";
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: "admin" | "member";
  created_at: string;
  user?: {
    id: number;
    username: string;
    phone?: string;
  };
}

export interface ProjectMemberCreate {
  user_id: number;
  role?: "admin" | "member";
}

export interface OrgProject {
  id: number;
  org_id: number;
  project_id: number;
  created_at: string;
  organization?: {
    id: number;
    name: string;
  };
}

export interface UserProject {
  id: number;
  name: string;
  code: string;
  status: "active" | "inactive" | "archived";
  role: "admin" | "member";
  created_at: string;
}

export const projectApi = {
  // Projects
  list: async (
    params: { page?: number; page_size?: number; status?: string } = {},
  ): Promise<{
    items: Project[];
    total: number;
    page: number;
    page_size: number;
  }> => {
    const res = await apiClient.get<
      ApiResponse<{
        items: Project[];
        total: number;
        page: number;
        page_size: number;
      }>
    >("/projects", { params });
    return res.data.data!;
  },

  getById: async (id: number): Promise<Project> => {
    const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return res.data.data!;
  },

  create: async (data: ProjectCreate): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<Project>>("/projects", data);
    return res.data.data!;
  },

  update: async (id: number, data: ProjectUpdate): Promise<Project> => {
    const res = await apiClient.put<ApiResponse<Project>>(
      `/projects/${id}`,
      data,
    );
    return res.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Project Members
  listMembers: async (
    projectId: number,
  ): Promise<{ items: ProjectMember[]; total: number }> => {
    const res = await apiClient.get<
      ApiResponse<{ items: ProjectMember[]; total: number }>
    >(`/projects/${projectId}/members`);
    return res.data.data!;
  },

  addMember: async (
    projectId: number,
    data: ProjectMemberCreate,
  ): Promise<ProjectMember> => {
    const res = await apiClient.post<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members`,
      data,
    );
    return res.data.data!;
  },

  updateMemberRole: async (
    projectId: number,
    userId: number,
    role: "admin" | "member",
  ): Promise<ProjectMember> => {
    const res = await apiClient.put<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members/${userId}`,
      { role },
    );
    return res.data.data!;
  },

  removeMember: async (projectId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  // Organization Associations
  listOrganizations: async (
    projectId: number,
  ): Promise<{ items: OrgProject[]; total: number }> => {
    const res = await apiClient.get<
      ApiResponse<{ items: OrgProject[]; total: number }>
    >(`/projects/${projectId}/organizations`);
    return res.data.data!;
  },

  associateOrg: async (
    projectId: number,
    orgId: number,
  ): Promise<OrgProject> => {
    const res = await apiClient.post<ApiResponse<OrgProject>>(
      `/projects/${projectId}/organizations`,
      { org_id: orgId },
    );
    return res.data.data!;
  },

  disassociateOrg: async (projectId: number, orgId: number): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/organizations/${orgId}`);
  },

  // User Projects
  getMyProjects: async (): Promise<{ items: UserProject[]; total: number }> => {
    const res = await apiClient.get<
      ApiResponse<{ items: UserProject[]; total: number }>
    >("/projects/users/me/projects");
    return res.data.data!;
  },
};
