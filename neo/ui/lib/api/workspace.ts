/**
 * Workspace API Client
 *
 * 与后端 API 交互的客户端模块
 * 后端地址: http://localhost:8000
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types
export interface Workspace {
	id: number;
	name: string;
	code: string;
	description?: string;
	status: WorkspaceStatus;
	owner_id: number;
	org_id: number;
	created_at: string;
	updated_at: string;
	disabled_at?: string;
	disabled_by?: number;
	member_count?: number;
	project_count?: number;
}

export type WorkspaceStatus = "active" | "disabled";

export interface Member {
	id: number;
	user_id: number;
	username?: string;
	phone?: string;
	role: MemberRole;
	joined_at: string;
}

export type MemberRole = "owner" | "admin" | "member" | "guest";

export interface CreateWorkspaceRequest {
	name: string;
	description?: string;
	org_id: number;
}

export interface UpdateWorkspaceRequest {
	name?: string;
	description?: string;
}

export interface AddMemberRequest {
	user_id: number;
	role: MemberRole;
}

export interface UpdateMemberRequest {
	role: MemberRole;
}

export interface ApiResponse<T> {
	code: number;
	message: string;
	data: T;
	traceId?: string;
	timestamp?: number;
}

export interface PaginatedResponse<T> {
	total: number;
	page: number;
	page_size: number;
	list: T[];
}

// Organization types (for workspace creation)
export interface OrganizationUnit {
	id: number;
	name: string;
	code: string;
	type: string;
	status: string;
	parent_id?: number;
}

// Organization types (for workspace creation)
export interface OrganizationUnit {
	id: number;
	name: string;
	code: string;
	type: string;
	status: string;
	parent_id?: number;
}

// Helper function to get auth token from cookies
async function getAuthToken(): Promise<string | null> {
	if (typeof window === "undefined") {
		return null;
	}
	const cookies = document.cookie.split(";");
	for (const cookie of cookies) {
		const [name, value] = cookie.trim().split("=");
		if (name === "access_token") {
			return value;
		}
	}
	return null;
}

// Generic fetch wrapper
async function fetchApi<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<ApiResponse<T>> {
	const url = `${API_BASE_URL}${endpoint}`;

	// Get token from cookie
	const token = await getAuthToken();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (options.headers && typeof options.headers === "object") {
		Object.assign(headers, options.headers);
	}

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await fetch(url, {
		...options,
		headers,
		credentials: "include",
	});

	const result = await response.json();
	return result;
}

// ==================== Workspace Operations ====================

/**
 * 获取工作区详情
 */
export async function getWorkspace(workspaceId: number): Promise<Workspace> {
	const response = await fetchApi<Workspace>(
		`/api/v1/workspaces/${workspaceId}`,
		{ method: "GET" },
	);
	if (response.code !== 0) {
		throw new Error(response.message || "获取工作区失败");
	}
	return response.data;
}

/**
 * 通过 code 获取工作区详情
 */
export async function getWorkspaceByCode(code: string): Promise<Workspace> {
	const response = await fetchApi<Workspace>(
		`/api/v1/workspaces/code/${code}`,
		{ method: "GET" },
	);
	if (response.code !== 0) {
		throw new Error(response.message || "获取工作区失败");
	}
	return response.data;
}

/**
 * 获取工作区列表
 */
export async function getWorkspaceList(params?: {
	org_id?: number;
	status?: WorkspaceStatus;
	search?: string;
	page?: number;
	page_size?: number;
}): Promise<PaginatedResponse<Workspace>> {
	const searchParams = new URLSearchParams();
	if (params?.org_id) searchParams.set("org_id", String(params.org_id));
	if (params?.status) searchParams.set("status", params.status);
	if (params?.search) searchParams.set("search", params.search);
	if (params?.page) searchParams.set("page", String(params.page));
	if (params?.page_size)
		searchParams.set("page_size", String(params.page_size));

	const queryString = searchParams.toString();
	const endpoint = `/api/v1/workspaces${queryString ? `?${queryString}` : ""}`;

	const response = await fetchApi<PaginatedResponse<Workspace>>(endpoint, {
		method: "GET",
	});
	if (response.code !== 0) {
		throw new Error(response.message || "获取工作区列表失败");
	}
	return response.data;
}

/**
 * 获取当前用户的工作区列表
 */
export async function getMyWorkspaces(params?: {
	status?: WorkspaceStatus;
	search?: string;
	page?: number;
	page_size?: number;
}): Promise<PaginatedResponse<Workspace>> {
	const searchParams = new URLSearchParams();
	if (params?.status) searchParams.set("status", params.status);
	if (params?.search) searchParams.set("search", params.search);
	if (params?.page) searchParams.set("page", String(params.page));
	if (params?.page_size)
		searchParams.set("page_size", String(params.page_size));

	const queryString = searchParams.toString();
	const endpoint = `/api/v1/workspaces/my${queryString ? `?${queryString}` : ""}`;

	const response = await fetchApi<PaginatedResponse<Workspace>>(endpoint, {
		method: "GET",
	});
	if (response.code !== 0) {
		throw new Error(response.message || "获取工作区列表失败");
	}
	return response.data;
}

/**
 * 创建工作区
 */
export async function createWorkspace(
	data: CreateWorkspaceRequest,
): Promise<Workspace> {
	const response = await fetchApi<Workspace>("/api/v1/workspaces", {
		method: "POST",
		body: JSON.stringify(data),
	});
	if (response.code !== 0) {
		throw new Error(response.message || "创建工作区失败");
	}
	return response.data;
}

/**
 * 更新工作区
 */
export async function updateWorkspace(
	workspaceId: number,
	data: UpdateWorkspaceRequest,
): Promise<Workspace> {
	const response = await fetchApi<Workspace>(
		`/api/v1/workspaces/${workspaceId}`,
		{
			method: "PATCH",
			body: JSON.stringify(data),
		},
	);
	if (response.code !== 0) {
		throw new Error(response.message || "更新工作区失败");
	}
	return response.data;
}

/**
 * 禁用工作区
 */
export async function disableWorkspace(
	workspaceId: number,
): Promise<Workspace> {
	const response = await fetchApi<Workspace>(
		`/api/v1/workspaces/${workspaceId}/disable`,
		{ method: "POST" },
	);
	if (response.code !== 0) {
		throw new Error(response.message || "禁用工作区失败");
	}
	return response.data;
}

/**
 * 启用工作区
 */
export async function enableWorkspace(workspaceId: number): Promise<Workspace> {
	const response = await fetchApi<Workspace>(
		`/api/v1/workspaces/${workspaceId}/enable`,
		{ method: "POST" },
	);
	if (response.code !== 0) {
		throw new Error(response.message || "启用工作区失败");
	}
	return response.data;
}

/**
 * 检查工作区访问权限
 */
export async function checkWorkspaceAccess(workspaceId: number): Promise<{
	is_member: boolean;
	is_owner: boolean;
	role: MemberRole | null;
}> {
	const response = await fetchApi<{
		workspace_id: number;
		user_id: number;
		is_member: boolean;
		is_owner: boolean;
		role: MemberRole | null;
	}>(`/api/v1/workspaces/${workspaceId}/check-access`, { method: "GET" });
	if (response.code !== 0) {
		throw new Error(response.message || "检查访问权限失败");
	}
	return response.data;
}

// ==================== Member Operations ====================

/**
 * 获取工作区成员列表
 */
export async function getWorkspaceMembers(
	workspaceId: number,
	params?: {
		role?: MemberRole;
		page?: number;
		page_size?: number;
	},
): Promise<PaginatedResponse<Member>> {
	const searchParams = new URLSearchParams();
	if (params?.role) searchParams.set("role", params.role);
	if (params?.page) searchParams.set("page", String(params.page));
	if (params?.page_size)
		searchParams.set("page_size", String(params.page_size));

	const queryString = searchParams.toString();
	const endpoint = `/api/v1/workspaces/${workspaceId}/members${
		queryString ? `?${queryString}` : ""
	}`;

	const response = await fetchApi<PaginatedResponse<Member>>(endpoint, {
		method: "GET",
	});
	if (response.code !== 0) {
		throw new Error(response.message || "获取成员列表失败");
	}
	return response.data;
}

/**
 * 添加工作区成员
 */
export async function addWorkspaceMember(
	workspaceId: number,
	userId: number,
	role: MemberRole,
): Promise<Member> {
	const response = await fetchApi<Member>(
		`/api/v1/workspaces/${workspaceId}/members`,
		{
			method: "POST",
			body: JSON.stringify({ user_id: userId, role }),
		},
	);
	if (response.code !== 0) {
		throw new Error(response.message || "添加成员失败");
	}
	return response.data;
}

/**
 * 更新成员角色
 */
export async function updateWorkspaceMember(
	workspaceId: number,
	memberId: number,
	role: MemberRole,
): Promise<Member> {
	const response = await fetchApi<Member>(
		`/api/v1/workspaces/${workspaceId}/members/${memberId}`,
		{
			method: "PATCH",
			body: JSON.stringify({ role }),
		},
	);
	if (response.code !== 0) {
		throw new Error(response.message || "更新成员角色失败");
	}
	return response.data;
}

/**
 * 移除工作区成员
 */
export async function removeWorkspaceMember(
	workspaceId: number,
	memberId: number,
): Promise<void> {
	const response = await fetchApi<null>(
		`/api/v1/workspaces/${workspaceId}/members/${memberId}`,
		{ method: "DELETE" },
	);
	if (response.code !== 0) {
		throw new Error(response.message || "移除成员失败");
	}
}

/**
 * 转移工作区所有权
 */
export async function transferWorkspaceOwnership(
	workspaceId: number,
	newOwnerId: number,
): Promise<Workspace> {
	const response = await fetchApi<Workspace>(
		`/api/v1/workspaces/${workspaceId}/transfer-owner`,
		{
			method: "POST",
			body: JSON.stringify({ new_owner_id: newOwnerId }),
		},
	);
	if (response.code !== 0) {
		throw new Error(response.message || "转移所有权失败");
	}
	return response.data;
}

// ==================== Organization Operations ====================

/**
 * 获取组织单元列表（用于创建工作区时的选择）
 */
export async function getOrganizationUnits(): Promise<OrganizationUnit[]> {
	const response = await fetchApi<{ list: OrganizationUnit[] }>(
		"/api/v1/org-units",
		{ method: "GET" },
	);
	if (response.code !== 0) {
		throw new Error(response.message || "获取组织列表失败");
	}
	return response.data.list || [];
}
