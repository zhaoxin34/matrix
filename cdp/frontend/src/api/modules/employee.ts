import apiClient from "../axios";
import type { ApiResponse } from "../types";
import type {
  Employee,
  EmployeeCreate,
  EmployeeListResponse,
  EmployeeStatus,
  EmployeeTransfer,
  EmployeeTransferCreate,
  EmployeeUpdate,
} from "@/types/org";

export interface EmployeeListParams {
  unit_id?: number;
  include_subordinates?: boolean;
  status?: EmployeeStatus;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export const employeeApi = {
  list: async (
    params: EmployeeListParams = {},
  ): Promise<EmployeeListResponse> => {
    const res = await apiClient.get<ApiResponse<EmployeeListResponse>>(
      "/employees",
      { params },
    );
    return res.data.data!;
  },

  getById: async (id: number): Promise<Employee> => {
    const res = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return res.data.data!;
  },

  create: async (data: EmployeeCreate): Promise<Employee> => {
    const res = await apiClient.post<ApiResponse<Employee>>("/employees", data);
    return res.data.data!;
  },

  update: async (id: number, data: EmployeeUpdate): Promise<Employee> => {
    const res = await apiClient.put<ApiResponse<Employee>>(
      `/employees/${id}`,
      data,
    );
    return res.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },

  bindUser: async (id: number, userId: number): Promise<Employee> => {
    const res = await apiClient.post<ApiResponse<Employee>>(
      `/employees/${id}/bind-user`,
      {
        user_id: userId,
      },
    );
    return res.data.data!;
  },

  unbindUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/employees/${id}/bind-user`);
  },

  initiateTransfer: async (
    id: number,
    data: EmployeeTransferCreate,
  ): Promise<EmployeeTransfer> => {
    const res = await apiClient.post<ApiResponse<EmployeeTransfer>>(
      `/employees/${id}/transfers`,
      data,
    );
    return res.data.data!;
  },

  approveTransfer: async (
    employeeId: number,
    transferId: number,
  ): Promise<Employee> => {
    const res = await apiClient.post<ApiResponse<Employee>>(
      `/employees/${employeeId}/transfers/${transferId}/approve`,
    );
    return res.data.data!;
  },

  confirmOnboarding: async (id: number): Promise<Employee> => {
    const res = await apiClient.post<ApiResponse<Employee>>(
      `/employees/${id}/confirm-onboarding`,
    );
    return res.data.data!;
  },

  getTransferHistory: async (id: number): Promise<EmployeeTransfer[]> => {
    const res = await apiClient.get<ApiResponse<EmployeeTransfer[]>>(
      `/employees/${id}/transfers`,
    );
    return res.data.data!;
  },

  importExcel: async (
    file: File,
  ): Promise<{ success: number; errors: unknown[] }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post<
      ApiResponse<{ success: number; errors: unknown[] }>
    >("/employees/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data!;
  },

  exportExcel: async (
    params: {
      unit_id?: number;
      include_subordinates?: boolean;
      status?: EmployeeStatus;
    } = {},
  ): Promise<void> => {
    const res = await apiClient.get("/employees/export", {
      params,
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
