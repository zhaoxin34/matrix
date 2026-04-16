import apiClient from '../axios'
import type { ApiResponse, PaginatedResponse } from '../types'
import type { Order, OrderCreateInput } from '@/types/order'

export const orderApi = {
  list: async (
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<Order>> => {
    const response = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: { page, pageSize },
    })
    return response.data
  },

  detail: async (id: string): Promise<Order> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`)
    return response.data.data
  },

  create: async (data: OrderCreateInput): Promise<Order> => {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', data)
    return response.data.data
  },

  cancel: async (id: string): Promise<Order> => {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/orders/${id}/cancel`
    )
    return response.data.data
  },
}
