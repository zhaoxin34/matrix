export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  code?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  message: string
  code?: number
  errors?: Record<string, string[]>
}

export type { AxiosError } from 'axios'
