import apiClient from '../axios'
import type { ApiResponse, PaginatedResponse } from '../types'
import type { Product, ProductCreateInput } from '@/types/product'

export const productApi = {
  list: async (
    page = 1,
    pageSize = 10
  ): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(
      '/products',
      { params: { page, pageSize } }
    )
    return response.data
  },

  detail: async (id: string): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`)
    return response.data.data
  },

  create: async (data: ProductCreateInput): Promise<Product> => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', data)
    return response.data.data
  },

  update: async (id: string, data: Partial<ProductCreateInput>): Promise<Product> => {
    const response = await apiClient.put<ApiResponse<Product>>(
      `/products/${id}`,
      data
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`)
  },
}
