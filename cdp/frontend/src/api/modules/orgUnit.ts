import apiClient from '../axios'
import type { ApiResponse } from '../types'
import type {
  OrgUnit,
  OrgUnitCreate,
  OrgUnitTreeNode,
  OrgUnitUpdate,
} from '@/types/org'

export const orgUnitApi = {
  getTree: async (): Promise<OrgUnitTreeNode[]> => {
    const res = await apiClient.get<ApiResponse<OrgUnitTreeNode[]>>('/org-units/tree')
    return res.data.data!
  },

  getById: async (id: number): Promise<OrgUnit> => {
    const res = await apiClient.get<ApiResponse<OrgUnit>>(`/org-units/${id}`)
    return res.data.data!
  },

  create: async (data: OrgUnitCreate): Promise<OrgUnit> => {
    const res = await apiClient.post<ApiResponse<OrgUnit>>('/org-units', data)
    return res.data.data!
  },

  update: async (id: number, data: OrgUnitUpdate): Promise<OrgUnit> => {
    const res = await apiClient.put<ApiResponse<OrgUnit>>(`/org-units/${id}`, data)
    return res.data.data!
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/org-units/${id}`)
  },

  move: async (id: number, newParentId: number | null): Promise<OrgUnit> => {
    const res = await apiClient.post<ApiResponse<OrgUnit>>(`/org-units/${id}/move`, {
      new_parent_id: newParentId,
    })
    return res.data.data!
  },

  toggleStatus: async (id: number): Promise<OrgUnit> => {
    const res = await apiClient.post<ApiResponse<OrgUnit>>(`/org-units/${id}/toggle-status`)
    return res.data.data!
  },
}
