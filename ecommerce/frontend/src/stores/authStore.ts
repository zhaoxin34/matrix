import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginInput, RegisterInput } from '@/types/user'
import { userApi } from '@/api/modules/user'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginInput) => Promise<void>
  register: (data: RegisterInput) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (data: LoginInput) => {
        set({ isLoading: true })
        try {
          const { user, token } = await userApi.login(data)
          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data: RegisterInput) => {
        set({ isLoading: true })
        try {
          const { user, token } = await userApi.register(data)
          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
