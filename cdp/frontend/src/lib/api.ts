import axios from "axios";
import type {
  User,
  LoginInput,
  RegisterInput,
  AuthResponse,
  TokenRefreshResponse,
} from "@/types/user";

interface BusinessError extends Error {
  code: number;
}

const API_BASE_URL = "/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Initialize auth header from localStorage on load (browser only)
if (typeof window !== "undefined") {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${accessToken}`;
  }
}

// Response interceptor for token handling and business error handling
apiClient.interceptors.response.use(
  (response) => {
    // Check for business error codes (code !== 0 means error)
    if (
      response.data &&
      typeof response.data.code === "number" &&
      response.data.code !== 0
    ) {
      const err: BusinessError = {
        name: "BusinessError",
        message: response.data.message || "Request failed",
        code: response.data.code,
      };
      return Promise.reject(err);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post<TokenRefreshResponse>(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
          );
          const { access_token, refresh_token } = response.data;
          localStorage.setItem("accessToken", access_token);
          localStorage.setItem("refreshToken", refresh_token);
          apiClient.defaults.headers.common["Authorization"] =
            `Bearer ${access_token}`;
          originalRequest.headers["Authorization"] = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const userApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post<{
      code: number;
      message: string;
      data: { access_token: string; refresh_token: string };
    }>("/auth/login", data);
    const { access_token, refresh_token } = response.data.data;
    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${access_token}`;
    // Fetch user profile after login
    const profileResponse = await apiClient.get<{
      code: number;
      message: string;
      data: User;
    }>("/auth/me");
    return {
      user: profileResponse.data.data,
      access_token,
      refresh_token,
    };
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await apiClient.post<{
      code: number;
      message: string;
      data: { access_token: string; refresh_token: string };
    }>("/auth/register", data);
    const { access_token, refresh_token } = response.data.data;
    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${access_token}`;
    // Fetch user profile after registration
    const profileResponse = await apiClient.get<{
      code: number;
      message: string;
      data: User;
    }>("/auth/me");
    return {
      user: profileResponse.data.data,
      access_token,
      refresh_token,
    };
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    delete apiClient.defaults.headers.common["Authorization"];
  },

  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await apiClient.post<TokenRefreshResponse>(
      "/auth/refresh",
      { refresh_token: refreshToken },
    );
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },
};

export default apiClient;
