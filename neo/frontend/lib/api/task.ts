/**
 * Task API client
 * Connects to backend API via frontend proxy: /api/v1/workspaces/{workspace_code}/tasks
 */

import { getAuthHeaders } from "@/lib/utils/auth";

// API base URL - use relative path (Next.js API route will proxy)
const API_BASE = "";

// Types matching backend API
export type TaskType = "temporary" | "periodic" | "dispatch";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "enabled" | "disabled";
export type TaskExecStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "paused";

export interface TaskRecordResponse {
  id: number;
  task_id: number;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  exec_status: string;
  result: string | null;
  process: Record<string, unknown> | null;
  failure_reason: string | null;
  recording_url: string | null;
  created_at: string;
}

export interface TaskRecordListResponse {
  items: TaskRecordResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TaskResponse {
  id: number;
  name: string;
  description: string | null;
  content: string | null;
  workspace_id: number;
  agent_id: number;
  owner_id: number;
  priority: TaskPriority;
  task_type: TaskType;
  last_exec_status: TaskExecStatus;
  status: TaskStatus;
  max_retry: number;
  retry_interval: number;
  webhook_url: string | null;
  webhook_secret: string | null;
  cron_expression: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  items: TaskResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  content?: string;
  agent_id: number;
  priority?: TaskPriority;
  cron_expression?: string;
  max_retry?: number;
  retry_interval?: number;
  webhook_url?: string;
  webhook_secret?: string;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  content?: string;
  agent_id?: number;
  priority?: TaskPriority;
  cron_expression?: string;
  max_retry?: number;
  retry_interval?: number;
  webhook_url?: string;
  webhook_secret?: string;
}

export interface TaskStatusResponse {
  id: number;
  status: TaskStatus;
}

// Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const authHeaders = getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await response.json();

  // Handle error responses
  if (data.code !== 0) {
    throw new ApiError(
      data.message || "Request failed",
      data.code || response.status,
      response.status,
    );
  }

  // Extract data from ApiResponse wrapper (code: 0 means success)
  if (data.data !== undefined) {
    return data.data;
  }

  return data as T;
}

// List tasks with pagination and filters
export async function listTasks(
  workspaceCode: string,
  options: {
    page?: number;
    page_size?: number;
    last_exec_status?: TaskExecStatus;
    task_type?: TaskType;
    priority?: TaskPriority;
    agent_id?: number;
    owner_id?: number;
    search?: string;
  } = {},
): Promise<TaskListResponse> {
  const params = new URLSearchParams();

  if (options.page) params.set("page", options.page.toString());
  if (options.page_size) params.set("page_size", options.page_size.toString());
  if (options.last_exec_status)
    params.set("last_exec_status", options.last_exec_status);
  if (options.task_type) params.set("task_type", options.task_type);
  if (options.priority) params.set("priority", options.priority);
  if (options.agent_id) params.set("agent_id", options.agent_id.toString());
  if (options.owner_id) params.set("owner_id", options.owner_id.toString());
  if (options.search) params.set("search", options.search);

  const queryString = params.toString();
  const endpoint = `/api/v1/workspaces/${workspaceCode}/tasks${queryString ? `?${queryString}` : ""}`;

  return apiRequest<TaskListResponse>(endpoint, {
    method: "GET",
  });
}

// Get a single task
export async function getTask(
  workspaceCode: string,
  taskId: number,
): Promise<TaskResponse> {
  return apiRequest<TaskResponse>(
    `/api/v1/workspaces/${workspaceCode}/tasks/${taskId}`,
    { method: "GET" },
  );
}

// Create a new task
export async function createTask(
  workspaceCode: string,
  data: CreateTaskRequest,
): Promise<TaskResponse> {
  return apiRequest<TaskResponse>(`/api/v1/workspaces/${workspaceCode}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update a task
export async function updateTask(
  workspaceCode: string,
  taskId: number,
  data: UpdateTaskRequest,
): Promise<TaskResponse> {
  return apiRequest<TaskResponse>(
    `/api/v1/workspaces/${workspaceCode}/tasks/${taskId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

// Delete a task
export async function deleteTask(
  workspaceCode: string,
  taskId: number,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/api/v1/workspaces/${workspaceCode}/tasks/${taskId}`,
    { method: "DELETE" },
  );
}

// Cancel a task
export async function cancelTask(
  workspaceCode: string,
  taskId: number,
): Promise<TaskResponse> {
  return apiRequest<TaskResponse>(
    `/api/v1/workspaces/${workspaceCode}/tasks/${taskId}/cancel`,
    { method: "POST" },
  );
}

// Disable a task
export async function disableTask(
  workspaceCode: string,
  taskId: number,
): Promise<TaskStatusResponse> {
  return apiRequest<TaskStatusResponse>(
    `/api/v1/workspaces/${workspaceCode}/tasks/${taskId}/disable`,
    { method: "PATCH" },
  );
}

// Enable a task
export async function enableTask(
  workspaceCode: string,
  taskId: number,
): Promise<TaskStatusResponse> {
  return apiRequest<TaskStatusResponse>(
    `/api/v1/workspaces/${workspaceCode}/tasks/${taskId}/enable`,
    { method: "PATCH" },
  );
}

// List task records
export async function listTaskRecords(
  workspaceCode: string,
  taskId: number,
  options: {
    page?: number;
    page_size?: number;
  } = {},
): Promise<TaskRecordListResponse> {
  const params = new URLSearchParams();

  if (options.page) params.set("page", options.page.toString());
  if (options.page_size) params.set("page_size", options.page_size.toString());

  const queryString = params.toString();
  const endpoint = `/api/v1/workspaces/${workspaceCode}/tasks/${taskId}/records${queryString ? `?${queryString}` : ""}`;

  return apiRequest<TaskRecordListResponse>(endpoint, {
    method: "GET",
  });
}

// Get a single task record
export async function getTaskRecord(
  workspaceCode: string,
  taskId: number,
  recordId: number,
): Promise<TaskRecordResponse> {
  return apiRequest<TaskRecordResponse>(
    `/api/v1/workspaces/${workspaceCode}/tasks/${taskId}/records/${recordId}`,
    { method: "GET" },
  );
}
