import apiClient from "./api";

export type OrgUnitType =
  | "company"
  | "branch"
  | "department"
  | "sub_department";
export type OrgUnitStatus = "active" | "inactive";
export type EmployeeStatus =
  | "onboarding"
  | "on_job"
  | "transferring"
  | "offboarding";

export interface OrgUnit {
  id: number;
  name: string;
  code: string;
  type: OrgUnitType;
  parent_id: number | null;
  level: number;
  status: OrgUnitStatus;
  sort_order: number;
  leader_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrgUnitTreeNode extends OrgUnit {
  member_count: number;
  total_member_count: number;
  children: OrgUnitTreeNode[];
}

export interface Employee {
  id: number;
  employee_no: string;
  name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  primary_unit_id: number | null;
  status: EmployeeStatus;
  entry_date: string | null;
  dimission_date: string | null;
  created_at: string;
}

export interface EmployeeCreate {
  employee_no: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  primary_unit_id?: number | null;
  entry_date?: string | null;
}

export interface EmployeeListResponse {
  items: Employee[];
  total: number;
  page: number;
  page_size: number;
}

export interface OrgUnitCreate {
  name: string;
  code: string;
  type: OrgUnitType;
  parent_id?: number | null;
}

export interface OrgUnitUpdate {
  name?: string;
  code?: string;
  type?: OrgUnitType;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: number;
}

export const orgApi = {
  getTree: async (): Promise<OrgUnitTreeNode[]> => {
    const response =
      await apiClient.get<ApiResponse<OrgUnitTreeNode[]>>("/org-units/tree");
    return response.data.data;
  },

  getEmployees: async (
    unitId?: number,
  ): Promise<{ employees: Employee[]; total: number }> => {
    const response = await apiClient.get<ApiResponse<EmployeeListResponse>>(
      "/employees",
      {
        params: unitId ? { unit_id: unitId } : undefined,
      },
    );
    return {
      employees: response.data.data.items,
      total: response.data.data.total,
    };
  },

  createEmployee: async (data: EmployeeCreate): Promise<Employee> => {
    const response = await apiClient.post<ApiResponse<Employee>>(
      "/employees",
      data,
    );
    return response.data.data;
  },

  deleteEmployee: async (id: number): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },

  createOrgUnit: async (data: OrgUnitCreate): Promise<OrgUnit> => {
    const response = await apiClient.post<ApiResponse<OrgUnit>>(
      "/org-units",
      data,
    );
    return response.data.data;
  },

  updateOrgUnit: async (id: number, data: OrgUnitUpdate): Promise<OrgUnit> => {
    const response = await apiClient.put<ApiResponse<OrgUnit>>(
      `/org-units/${id}`,
      data,
    );
    return response.data.data;
  },

  deleteOrgUnit: async (id: number): Promise<void> => {
    await apiClient.delete(`/org-units/${id}`);
  },

  toggleOrgUnitStatus: async (id: number): Promise<OrgUnit> => {
    const response = await apiClient.post<ApiResponse<OrgUnit>>(
      `/org-units/${id}/toggle-status`,
    );
    return response.data.data;
  },
};
