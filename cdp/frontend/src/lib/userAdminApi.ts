import apiClient from "./api";

export interface AdminUserItem {
  id: number;
  username: string;
  phone: string | null;
  email: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  items: AdminUserItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateUserData {
  username: string;
  phone: string;
  email?: string;
  password: string;
  is_admin: boolean;
}

export interface UpdateUserData {
  username: string;
  phone: string;
  email?: string;
  is_admin: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: number;
}

export const userAdminApi = {
  listUsers: async (
    page: number = 1,
    pageSize: number = 10,
  ): Promise<UserListResponse> => {
    const response = await apiClient.get<ApiResponse<UserListResponse>>(
      "/admin/users",
      {
        params: { page, page_size: pageSize },
      },
    );
    return response.data.data;
  },

  createUser: async (data: CreateUserData): Promise<AdminUserItem> => {
    const response = await apiClient.post<ApiResponse<AdminUserItem>>(
      "/admin/users",
      data,
    );
    return response.data.data;
  },

  updateUser: async (
    userId: number,
    data: UpdateUserData,
  ): Promise<AdminUserItem> => {
    const response = await apiClient.put<ApiResponse<AdminUserItem>>(
      `/admin/users/${userId}`,
      data,
    );
    return response.data.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },
};
