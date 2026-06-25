/**
 * Events API Client
 * Handles all event related API calls
 */

import type {
	Event,
	CreateEventInput,
	UpdateEventInput,
} from "@/components/event";
import type { ApiResponse } from "@/components/workspace/workspace-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================
// API Fetch Wrapper
// ============================================================
async function apiFetch<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<ApiResponse<T>> {
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

	// Handle 204 No Content
	if (response.status === 204) {
		return { code: 0, message: "ok", data: null } as ApiResponse<T>;
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

	return data as ApiResponse<T>;
}

// ============================================================
// Events API
// ============================================================

export interface EventListResponse {
	items: Event[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}

export interface ListEventsParams {
	page?: number;
	page_size?: number;
	name?: string;
	entity_name?: string;
	actor?: string;
	timestamp_start?: string;
	timestamp_end?: string;
	embedded_site_id?: number;
}

/**
 * List events for a workspace
 * GET /api/v1/workspaces/{workspace_code}/events
 */
export async function listEvents(
	workspaceCode: string,
	params: ListEventsParams = {},
): Promise<{
	list: Event[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}> {
	const searchParams = new URLSearchParams();
	if (params.page) searchParams.set("page", String(params.page));
	if (params.page_size) searchParams.set("page_size", String(params.page_size));
	if (params.name) searchParams.set("name", params.name);
	if (params.entity_name) searchParams.set("entity_name", params.entity_name);
	if (params.actor) searchParams.set("actor", params.actor);
	if (params.embedded_site_id)
		searchParams.set("embedded_site_id", String(params.embedded_site_id));
	if (params.timestamp_start)
		searchParams.set("timestamp_start", params.timestamp_start);
	if (params.timestamp_end)
		searchParams.set("timestamp_end", params.timestamp_end);

	const query = searchParams.toString();
	const response = await apiFetch<EventListResponse>(
		`/api/v1/workspaces/${workspaceCode}/events${query ? `?${query}` : ""}`,
	);

	return {
		list: response.data?.items || [],
		total: response.data?.total || 0,
		page: response.data?.page || 1,
		page_size: response.data?.page_size || 20,
		total_pages: response.data?.total_pages || 0,
	};
}

/**
 * Get single event
 * GET /api/v1/workspaces/{workspace_code}/events/{id}
 */
export async function getEvent(
	workspaceCode: string,
	eventId: number,
): Promise<Event> {
	const response = await apiFetch<Event>(
		`/api/v1/workspaces/${workspaceCode}/events/${eventId}`,
	);
	return response.data;
}

/**
 * Create event
 * POST /api/v1/workspaces/{workspace_code}/events
 */
export async function createEvent(
	workspaceCode: string,
	data: CreateEventInput,
): Promise<Event> {
	const response = await apiFetch<Event>(
		`/api/v1/workspaces/${workspaceCode}/events`,
		{
			method: "POST",
			body: JSON.stringify(data),
		},
	);
	return response.data;
}

/**
 * Update event
 * PUT /api/v1/workspaces/{workspace_code}/events/{id}
 */
export async function updateEvent(
	workspaceCode: string,
	eventId: number,
	data: UpdateEventInput,
): Promise<Event> {
	const response = await apiFetch<Event>(
		`/api/v1/workspaces/${workspaceCode}/events/${eventId}`,
		{
			method: "PUT",
			body: JSON.stringify(data),
		},
	);
	return response.data;
}

/**
 * Delete event (hard delete)
 * DELETE /api/v1/workspaces/{workspace_code}/events/{id}
 */
export async function deleteEvent(
	workspaceCode: string,
	eventId: number,
): Promise<void> {
	await apiFetch<void>(
		`/api/v1/workspaces/${workspaceCode}/events/${eventId}`,
		{
			method: "DELETE",
		},
	);
}

// ============================================================
// Error Helper
// ============================================================
export function getErrorMessage(code: number): string {
	const messages: Record<number, string> = {
		0: "成功",
		1001: "参数错误",
		1002: "未授权",
		1003: "禁止访问",
		4001: "事件不存在",
		4002: "事件名称已存在",
		3001: "工作区不存在",
		3002: "工作区名称已存在",
		9001: "服务器内部错误",
	};
	return messages[code] || "请求失败，请稍后重试";
}
