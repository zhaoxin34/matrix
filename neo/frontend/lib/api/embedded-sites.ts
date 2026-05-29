/**
 * Embedded Sites API Client
 * Handles all embedded site related API calls
 */

import type {
	EmbeddedSite,
	CreateEmbeddedSiteInput,
	UpdateEmbeddedSiteInput,
} from "@/components/embedded-site";
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
	const token = parsed?.state?.user?.token ?? null;

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		},
		credentials: "include",
	});

	const data = await response.json();

	if (!response.ok) {
		throw {
			code: data.code || response.status,
			message: data.message || "请求失败",
			detail: data.detail,
		};
	}

	// API may return data without code field (success by default) or with code=0
	// Only throw error if code exists and is non-zero
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
// Embedded Sites API
// ============================================================

export interface EmbeddedSiteListResponse {
	items: EmbeddedSite[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}

export interface EmbeddedSiteStatusResponse {
	id: number;
	status: string;
	updated_at: string;
}

export interface ListEmbeddedSitesParams {
	page?: number;
	page_size?: number;
	status?: "ENABLED" | "DISABLED";
	search?: string;
}

/**
 * List embedded sites for a workspace
 * GET /api/v1/workspaces/{workspace_code}/embedded-sites
 */
export async function listEmbeddedSites(
	workspaceCode: string,
	params: ListEmbeddedSitesParams = {},
): Promise<{
	list: EmbeddedSite[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}> {
	const searchParams = new URLSearchParams();
	if (params.page) searchParams.set("page", String(params.page));
	if (params.page_size) searchParams.set("page_size", String(params.page_size));
	if (params.status) searchParams.set("status", params.status);
	if (params.search) searchParams.set("search", params.search);

	const query = searchParams.toString();
	const response = await apiFetch<EmbeddedSiteListResponse>(
		`/api/v1/workspaces/${workspaceCode}/embedded-sites${query ? `?${query}` : ""}`,
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
 * Get single embedded site
 * GET /api/v1/workspaces/{workspace_code}/embedded-sites/{id}
 */
export async function getEmbeddedSite(
	workspaceCode: string,
	siteId: number,
): Promise<EmbeddedSite> {
	const response = await apiFetch<EmbeddedSite>(
		`/api/v1/workspaces/${workspaceCode}/embedded-sites/${siteId}`,
	);
	return response.data;
}

/**
 * Create embedded site
 * POST /api/v1/workspaces/{workspace_code}/embedded-sites
 */
export async function createEmbeddedSite(
	workspaceCode: string,
	data: CreateEmbeddedSiteInput,
): Promise<EmbeddedSite> {
	const response = await apiFetch<EmbeddedSite>(
		`/api/v1/workspaces/${workspaceCode}/embedded-sites`,
		{
			method: "POST",
			body: JSON.stringify(data),
		},
	);
	return response.data;
}

/**
 * Update embedded site
 * PUT /api/v1/workspaces/{workspace_code}/embedded-sites/{id}
 */
export async function updateEmbeddedSite(
	workspaceCode: string,
	siteId: number,
	data: UpdateEmbeddedSiteInput,
): Promise<EmbeddedSite> {
	const response = await apiFetch<EmbeddedSite>(
		`/api/v1/workspaces/${workspaceCode}/embedded-sites/${siteId}`,
		{
			method: "PUT",
			body: JSON.stringify(data),
		},
	);
	return response.data;
}

/**
 * Delete embedded site (soft delete)
 * DELETE /api/v1/workspaces/{workspace_code}/embedded-sites/{id}
 */
export async function deleteEmbeddedSite(
	workspaceCode: string,
	siteId: number,
): Promise<void> {
	await apiFetch<void>(
		`/api/v1/workspaces/${workspaceCode}/embedded-sites/${siteId}`,
		{
			method: "DELETE",
		},
	);
}

/**
 * Enable embedded site
 * PATCH /api/v1/workspaces/{workspace_code}/embedded-sites/{id}/enable
 */
export async function enableEmbeddedSite(
	workspaceCode: string,
	siteId: number,
): Promise<EmbeddedSiteStatusResponse> {
	const response = await apiFetch<EmbeddedSiteStatusResponse>(
		`/api/v1/workspaces/${workspaceCode}/embedded-sites/${siteId}/enable`,
		{
			method: "PATCH",
		},
	);
	return response.data;
}

/**
 * Disable embedded site
 * PATCH /api/v1/workspaces/{workspace_code}/embedded-sites/{id}/disable
 */
export async function disableEmbeddedSite(
	workspaceCode: string,
	siteId: number,
): Promise<EmbeddedSiteStatusResponse> {
	const response = await apiFetch<EmbeddedSiteStatusResponse>(
		`/api/v1/workspaces/${workspaceCode}/embedded-sites/${siteId}/disable`,
		{
			method: "PATCH",
		},
	);
	return response.data;
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
		2001: "嵌入网站不存在",
		2002: "嵌入网站名称已存在",
		2003: "存在关联的 Agent",
		3001: "工作区不存在",
		3002: "工作区名称已存在",
		9001: "服务器内部错误",
	};
	return messages[code] || "请求失败，请稍后重试";
}
