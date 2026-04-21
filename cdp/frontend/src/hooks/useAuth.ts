import { useAuthStore } from "@/stores/authStore";
import type { LoginInput, RegisterInput } from "@/types/user";

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, register, logout } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login: async (data: LoginInput) => {
      await login(data.phone, data.password);
    },
    register: async (data: RegisterInput) => {
      await register(data);
    },
    logout,
  };
}
