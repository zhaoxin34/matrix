"use client";

import type {
  Interceptor,
  InterceptorFilter,
} from "@/components/interceptor/interceptor-types";
import type { ApiResponse } from "@/components/workspace/workspace-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const rawToken =
    typeof window !== "undefined" ? localStorage.getItem("neo-auth") : null;
  const parsed = rawToken ? JSON.parse(rawToken) : null;
  const token = parsed?.user?.token ?? parsed?.state?.user?.token ?? null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: "include",
  });

  if (response.status === 204) {
    return { code: 0, message: "ok", data: null } as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw {
      code: data.code || response.status,
      message: data.message || "请求失败",
      detail: data.detail,
    };
  }

  if (data.code !== undefined && data.code !== 0) {
    throw {
      code: data.code,
      message: data.message || "请求失败",
      detail: data.detail,
    };
  }

  return data as T;
}

const BASE_PATH = "/api/v1/workspaces";

export async function getInterceptors(
  workspaceCode: string,
  filter?: InterceptorFilter,
): Promise<{
  items: Interceptor[];
  total: number;
  page: number;
  page_size: number;
}> {
  const params = new URLSearchParams();
  if (filter?.embedded_site_id)
    params.set("embedded_site_id", String(filter.embedded_site_id));
  if (filter?.status) params.set("status", filter.status);
  if (filter?.name) params.set("name", filter.name);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.page_size) params.set("page_size", String(filter.page_size));

  const query = params.toString();
  const path = `${BASE_PATH}/${workspaceCode}/interceptors${query ? `?${query}` : ""}`;
  const result = await apiFetch<
    ApiResponse<{
      items: Interceptor[];
      total: number;
      page: number;
      page_size: number;
    }>
  >(path);
  return result.data;
}

export async function getInterceptor(
  workspaceCode: string,
  interceptorId: number,
): Promise<Interceptor> {
  const result = await apiFetch<ApiResponse<Interceptor>>(
    `${BASE_PATH}/${workspaceCode}/interceptors/${interceptorId}`,
  );
  return result.data;
}

export async function createInterceptor(
  workspaceCode: string,
  data: {
    embedded_site_id: number;
    name: string;
    event_name: string;
    entity_name: string;
    target_entity_name?: string;
    mode?: "observe" | "intercept";
    trigger: {
      type: string;
      selector?: string;
      url_pattern?: string;
      method?: string;
    };
    before_actions?: Array<{ type: string; config: Record<string, unknown> }>;
    after_actions?: Array<{ type: string; config: Record<string, unknown> }>;
    page_url_pattern?: string;
    debounce_ms?: number;
  },
): Promise<Interceptor> {
  const result = await apiFetch<ApiResponse<Interceptor>>(
    `${BASE_PATH}/${workspaceCode}/interceptors`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return result.data;
}

export async function updateInterceptor(
  workspaceCode: string,
  interceptorId: number,
  data: {
    embedded_site_id?: number;
    name?: string;
    event_name?: string;
    entity_name?: string;
    target_entity_name?: string;
    mode?: "observe" | "intercept";
    trigger?: {
      type: string;
      selector?: string;
      url_pattern?: string;
      method?: string;
    };
    before_actions?: Array<{ type: string; config: Record<string, unknown> }>;
    after_actions?: Array<{ type: string; config: Record<string, unknown> }>;
    page_url_pattern?: string;
    debounce_ms?: number;
  },
): Promise<Interceptor> {
  const result = await apiFetch<ApiResponse<Interceptor>>(
    `${BASE_PATH}/${workspaceCode}/interceptors/${interceptorId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  return result.data;
}

export async function deleteInterceptor(
  workspaceCode: string,
  interceptorId: number,
): Promise<void> {
  return apiFetch<void>(
    `${BASE_PATH}/${workspaceCode}/interceptors/${interceptorId}`,
    { method: "DELETE" },
  );
}

export async function enableInterceptor(
  workspaceCode: string,
  interceptorId: number,
): Promise<Interceptor> {
  const result = await apiFetch<ApiResponse<Interceptor>>(
    `${BASE_PATH}/${workspaceCode}/interceptors/${interceptorId}/enable`,
    {
      method: "POST",
    },
  );
  return result.data;
}

export async function disableInterceptor(
  workspaceCode: string,
  interceptorId: number,
): Promise<Interceptor> {
  const result = await apiFetch<ApiResponse<Interceptor>>(
    `${BASE_PATH}/${workspaceCode}/interceptors/${interceptorId}/disable`,
    {
      method: "POST",
    },
  );
  return result.data;
}
