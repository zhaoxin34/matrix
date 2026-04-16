import apiClient from '../axios'
import type { ApiResponse } from '../types'
import type { User } from '@/types/user'

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export const userApi = {
  login: async (data: { phone: string; password: string }): Promise<{ user: User; access_token: string; refresh_token: string }> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      '/auth/login',
      data
    )
    const { access_token, refresh_token } = response.data.data
    // Fetch user profile with the new token
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    const profileResponse = await apiClient.get<ApiResponse<User>>('/auth/me')
    return {
      user: profileResponse.data.data,
      access_token,
      refresh_token,
    }
  },

  register: async (data: { username: string; phone: string; password: string }): Promise<{ user: User; access_token: string; refresh_token: string }> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      '/auth/register',
      data
    )
    const { access_token, refresh_token } = response.data.data
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    const profileResponse = await apiClient.get<ApiResponse<User>>('/auth/me')
    return {
      user: profileResponse.data.data,
      access_token,
      refresh_token,
    }
  },

  refreshToken: async (refresh_token: string): Promise<{ access_token: string; refresh_token: string }> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      '/auth/refresh',
      { refresh_token }
    )
    return response.data.data
  },

  logout: async (refresh_token: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh_token })
    delete apiClient.defaults.headers.common['Authorization']
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },
}
