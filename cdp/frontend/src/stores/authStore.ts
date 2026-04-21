import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';
import { userApi } from '@/api/modules/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { username: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (phone: string, password: string) => {
        set({ isLoading: true });
        try {
          const result = await userApi.login({ phone, password });
          set({
            user: result.user,
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: { username: string; phone: string; password: string }) => {
        set({ isLoading: true });
        try {
          const result = await userApi.register(data);
          set({
            user: result.user,
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        const { refreshToken } = get();
        if (refreshToken) {
          userApi.logout(refreshToken).catch(() => {});
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const tokens = await userApi.refreshToken(refreshToken);
          set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
          return true;
        } catch {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return false;
        }
      },

      fetchCurrentUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        try {
          const user = await userApi.getMe();
          set({ user });
        } catch {
          const refreshed = await get().refreshAccessToken();
          if (refreshed) {
            const user = await userApi.getMe();
            set({ user });
          }
        }
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
