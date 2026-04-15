import apiClient from '../axios'
import type { ApiResponse } from '../types'
import type { CartItem, CartItemInput } from '@/types/product'

export const cartApi = {
  get: async (): Promise<CartItem[]> => {
    const response = await apiClient.get<ApiResponse<CartItem[]>>('/cart')
    return response.data.data
  },

  add: async (data: CartItemInput): Promise<CartItem> => {
    const response = await apiClient.post<ApiResponse<CartItem>>('/cart', data)
    return response.data.data
  },

  update: async (id: string, data: Partial<CartItemInput>): Promise<CartItem> => {
    const response = await apiClient.put<ApiResponse<CartItem>>(
      `/cart/${id}`,
      data
    )
    return response.data.data
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/cart/${id}`)
  },

  clear: async (): Promise<void> => {
    await apiClient.delete('/cart')
  },
}
