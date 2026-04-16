import apiClient from '../axios'
import type { ApiResponse } from '../types'
import type { User, LoginInput, RegisterInput } from '@/types/user'

export const userApi = {
  login: async (data: LoginInput): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      data
    )
    return response.data.data
  },

  register: async (data: RegisterInput): Promise<{ user: User; token: string }> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/register',
      data
    )
    return response.data.data
  },

  profile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile')
    return response.data.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data)
    return response.data.data
  },
}
