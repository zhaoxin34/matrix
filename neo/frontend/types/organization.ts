// ============================================================
// Organization Unit Types
// ============================================================
export type OrgUnitType =
  | "company"
  | "branch"
  | "department"
  | "sub_department";
export type OrgUnitStatus = "active" | "inactive";

// ============================================================
// Employee Types
// ============================================================
export type EmployeeStatus =
  | "onboarding"
  | "on_job"
  | "transferring"
  | "offboarding";
export type TransferType = "promotion" | "demotion" | "transfer";

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: number;
}

export interface OrgUnitSimple {
  id: number;
  name: string;
  code: string;
  type: OrgUnitType;
}

export interface OrgUnitResponse {
  id: number;
  name: string;
  code: string;
  type: OrgUnitType;
  parent_id: number | null;
  level: number;
  sort_order: number;
  leader_id: number | null;
  status: OrgUnitStatus;
  created_at: string;
  updated_at: string;
}

export interface OrgUnitTreeItem {
  id: number;
  name: string;
  code: string;
  type: OrgUnitType;
  level: number;
  sort_order: number;
  leader_id: number | null;
  status: OrgUnitStatus;
  children: OrgUnitTreeItem[];
  total_member_count?: number;
}

// ============================================================
// Employee Response Types
// ============================================================
export interface EmployeeResponse {
  id: number;
  employee_no: string;
  name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  primary_unit: OrgUnitSimple | null;
  secondary_units: OrgUnitSimple[];
  status: EmployeeStatus;
  entry_date: string | null;
  dimission_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeListResponse {
  total: number;
  page: number;
  page_size: number;
  list: EmployeeResponse[];
}

// ============================================================
// Request Types
// ============================================================
export interface OrgUnitCreateRequest {
  name: string;
  code: string;
  type: OrgUnitType;
  parent_id?: number;
  sort_order?: number;
  leader_id?: number;
}

export interface OrgUnitUpdateRequest {
  name?: string;
  sort_order?: number;
  leader_id?: number;
}

export interface OrgUnitStatusUpdateRequest {
  status: OrgUnitStatus;
}

export interface EmployeeCreateRequest {
  employee_no: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  primary_unit_id?: number;
  entry_date?: string;
  secondary_unit_ids?: number[];
}

export interface EmployeeUpdateRequest {
  name?: string;
  phone?: string;
  email?: string;
  position?: string;
  primary_unit_id?: number;
  entry_date?: string;
}

export interface EmployeeTransferRequest {
  to_unit_id: number;
  transfer_type: TransferType;
  effective_date: string;
  reason?: string;
}

// ============================================================
// API Error Types
// ============================================================
export interface ApiError {
  code: number;
  message: string;
  detail?: string;
}

// ============================================================
// Dashboard Stats
// ============================================================
export interface OrgDashboardStats {
  org_count: number;
  total_employees: number;
  on_job: number;
  onboarding: number;
}
