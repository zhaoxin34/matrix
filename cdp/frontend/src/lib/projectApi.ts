import apiClient from "./api";

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

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: number;
}

export interface ProjectMember {
  id: number;
  user_id: number;
  project_id: number;
  role: "admin" | "member";
  created_at: string;
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
    code: string;
  };
}

export const projectApi = {
  list: async (params: {
    page?: number;
    page_size?: number;
    keyword?: string;
  }): Promise<ProjectListResponse> => {
    const response = await apiClient.get<ApiResponse<ProjectListResponse>>(
      "/projects",
      { params },
    );
    return response.data.data;
  },

  get: async (id: number): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<Project>>(
      `/projects/${id}`,
    );
    return response.data.data;
  },

  create: async (data: ProjectCreate): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>(
      "/projects",
      data,
    );
    return response.data.data;
  },

  update: async (id: number, data: ProjectUpdate): Promise<Project> => {
    const response = await apiClient.patch<ApiResponse<Project>>(
      `/projects/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  listMembers: async (
    projectId: number,
  ): Promise<{ items: ProjectMember[]; total: number }> => {
    const response = await apiClient.get<
      ApiResponse<{ items: ProjectMember[]; total: number }>
    >(`/projects/${projectId}/members`);
    return response.data.data;
  },

  addMember: async (
    projectId: number,
    data: ProjectMemberCreate,
  ): Promise<ProjectMember> => {
    const response = await apiClient.post<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members`,
      data,
    );
    return response.data.data;
  },

  removeMember: async (projectId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  updateMemberRole: async (
    projectId: number,
    userId: number,
    role: "admin" | "member",
  ): Promise<ProjectMember> => {
    const response = await apiClient.patch<ApiResponse<ProjectMember>>(
      `/projects/${projectId}/members/${userId}`,
      { role },
    );
    return response.data.data;
  },

  listOrganizations: async (
    projectId: number,
  ): Promise<{ items: OrgProject[]; total: number }> => {
    const response = await apiClient.get<
      ApiResponse<{ items: OrgProject[]; total: number }>
    >(`/projects/${projectId}/organizations`);
    return response.data.data;
  },

  associateOrg: async (
    projectId: number,
    orgId: number,
  ): Promise<OrgProject> => {
    const response = await apiClient.post<ApiResponse<OrgProject>>(
      `/projects/${projectId}/organizations`,
      { org_id: orgId },
    );
    return response.data.data;
  },

  disassociateOrg: async (projectId: number, orgId: number): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/organizations/${orgId}`);
  },
};
