import apiClient from '../axios'
import type { ApiResponse } from '../types'
import type {
  Product,
  ProductListResponse,
  CategoryTree,
  SearchSuggestion,
} from '@/types/product'

export interface ProductListParams {
  page?: number
  limit?: number
  category_id?: number
  brand?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export const productApi = {
  list: async (params: ProductListParams = {}): Promise<ProductListResponse> => {
    const response = await apiClient.get<ProductListResponse>('/products', { params })
    return response.data
  },

  detail: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`)
    return response.data
  },

  search: async (q: string, limit = 10): Promise<SearchSuggestion[]> => {
    const response = await apiClient.get<ApiResponse<SearchSuggestion[]>>('/products/search', {
      params: { q, limit },
    })
    return response.data.data
  },

  getBrands: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/products/brands')
    return response.data
  },

  getCategories: async (): Promise<CategoryTree[]> => {
    const response = await apiClient.get<CategoryTree[]>('/categories')
    return response.data
  },

  getCategoriesFlat: async (
    page = 1,
    pageSize = 100
  ): Promise<{ items: CategoryTree[]; total: number; pages: number }> => {
    const response = await apiClient.get('/categories/flat', { params: { page, page_size: pageSize } })
    return response.data
  },
}
