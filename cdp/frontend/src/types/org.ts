// 组织架构相关类型定义

export type OrgUnitType = 'company' | 'branch' | 'department' | 'sub_department'
export type OrgUnitStatus = 'active' | 'inactive'
export type EmployeeStatus = 'onboarding' | 'on_job' | 'transferring' | 'offboarding'
export type TransferType = 'promotion' | 'demotion' | 'transfer'

export interface OrgUnit {
  id: number
  name: string
  code: string
  type: OrgUnitType
  parent_id: number | null
  level: number
  status: OrgUnitStatus
  sort_order: number
  leader_id: number | null
  created_at: string
  updated_at: string
}

export interface OrgUnitTreeNode extends OrgUnit {
  member_count: number
  total_member_count: number
  children: OrgUnitTreeNode[]
}

export interface OrgUnitCreate {
  name: string
  code: string
  type: OrgUnitType
  parent_id?: number | null
  leader_id?: number | null
  sort_order?: number
}

export interface OrgUnitUpdate {
  name?: string
  code?: string
  leader_id?: number | null
  sort_order?: number
  status?: OrgUnitStatus
}

export interface UserMapping {
  user_id: number
  created_at: string
}

export interface Employee {
  id: number
  employee_no: string
  name: string
  phone: string | null
  email: string | null
  position: string | null
  primary_unit_id: number | null
  status: EmployeeStatus
  entry_date: string | null
  dimission_date: string | null
  secondary_unit_ids: number[]
  user_mapping: UserMapping | null
  created_at: string
  updated_at: string
}

export interface EmployeeCreate {
  employee_no: string
  name: string
  phone?: string | null
  email?: string | null
  position?: string | null
  primary_unit_id?: number | null
  entry_date?: string | null
  secondary_unit_ids?: number[]
  user_id?: number | null
}

export interface EmployeeUpdate {
  name?: string
  phone?: string | null
  email?: string | null
  position?: string | null
  primary_unit_id?: number | null
  entry_date?: string | null
  secondary_unit_ids?: number[]
}

export interface EmployeeTransfer {
  id: number
  employee_id: number
  from_unit_id: number | null
  to_unit_id: number
  transfer_type: TransferType
  effective_date: string
  reason: string | null
  created_at: string
}

export interface EmployeeTransferCreate {
  to_unit_id: number
  transfer_type: TransferType
  effective_date: string
  reason?: string | null
}

export interface EmployeeListResponse {
  items: Employee[]
  total: number
  page: number
  page_size: number
}

export interface OrgDashboard {
  org_count: number
  total_employees: number
  on_job: number
  onboarding: number
}
