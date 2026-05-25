/**
 * API Client Configuration
 * Unified HTTP client for backend communication
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_TIMEOUT = 30000;

interface ApiRequestConfig extends RequestInit {
  timeout?: number;
}

/**
 * Unified API response format matching backend ApiResponse<T>
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  traceId: string;
  timestamp: number;
}

/**
 * Create fetch request with timeout and error handling
 */
async function createRequest<T>(
  endpoint: string,
  config: ApiRequestConfig = {},
): Promise<ApiResponse<T>> {
  const { timeout = API_TIMEOUT, headers, ...rest } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return {
        code: -1,
        message: "Request timeout",
        data: null,
        traceId: "",
        timestamp: Date.now(),
      };
    }
    throw error;
  }
}

/**
 * API client methods
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: ApiRequestConfig) =>
    createRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestConfig) =>
    createRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestConfig) =>
    createRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: ApiRequestConfig) =>
    createRequest<T>(endpoint, { ...options, method: "DELETE" }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiRequestConfig) =>
    createRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
