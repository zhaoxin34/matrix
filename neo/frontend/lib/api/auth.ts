/**
 * Auth API Client
 * Handles all authentication related API calls
 */

import type {
  ApiError,
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SendCodeRequest,
  SendCodeResponse,
  UserListRequest,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  User,
  ErrorCode,
} from "@/types/auth";
import { ErrorMessages, ErrorCodes } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================
// API Fetch Wrapper
// ============================================================
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    const error: ApiError = {
      code: data.code || response.status,
      message: data.message || "请求失败",
      detail: data.detail,
    };
    throw error;
  }

  return data as ApiResponse<T>;
}

// ============================================================
// Auth API
// ============================================================

/**
 * User Login
 * POST /api/v1/auth/login
 */
export async function login(
  credentials: LoginRequest,
): Promise<ApiResponse<LoginResponse>> {
  return apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * User Registration
 * POST /api/v1/auth/register
 */
export async function register(
  data: RegisterRequest,
): Promise<ApiResponse<RegisterResponse>> {
  return apiFetch<RegisterResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Send Verification Code
 * POST /api/v1/auth/send-code
 */
export async function sendCode(
  data: SendCodeRequest,
): Promise<ApiResponse<SendCodeResponse>> {
  return apiFetch<SendCodeResponse>("/api/v1/auth/send-code", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get Error Message from Error Code
 */
export function getErrorMessage(code: number): string {
  return ErrorMessages[code as ErrorCode] || "请求失败，请稍后重试";
}

// ============================================================
// Admin User API
// ============================================================

/**
 * Get User List
 * GET /api/v1/admin/users
 */
export async function getUserList(
  params: UserListRequest = {},
): Promise<ApiResponse<UserListResponse>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return apiFetch<UserListResponse>(
    `/api/v1/admin/users${query ? `?${query}` : ""}`,
  );
}

/**
 * Create User
 * POST /api/v1/admin/users
 */
export async function createUser(
  data: CreateUserRequest,
): Promise<ApiResponse<User>> {
  return apiFetch<User>("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update User
 * PUT /api/v1/admin/users/{id}
 */
export async function updateUser(
  id: number,
  data: UpdateUserRequest,
): Promise<ApiResponse<User>> {
  return apiFetch<User>(`/api/v1/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Update User Status (Enable/Disable)
 * PATCH /api/v1/admin/users/{id}/status
 */
export async function updateUserStatus(
  id: number,
  data: UpdateUserStatusRequest,
): Promise<ApiResponse<User>> {
  return apiFetch<User>(`/api/v1/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
