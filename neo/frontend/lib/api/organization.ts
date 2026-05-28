/**
 * Organization Unit API Client
 * Handles all organization unit and employee related API calls
 */

import type {
	ApiResponse,
	OrgUnitResponse,
	OrgUnitTreeItem,
	OrgUnitCreateRequest,
	OrgUnitUpdateRequest,
	OrgUnitStatusUpdateRequest,
	EmployeeListResponse,
	EmployeeResponse,
	EmployeeCreateRequest,
	EmployeeUpdateRequest,
	EmployeeTransferRequest,
	OrgDashboardStats,
	UserListItem,
	UnlinkedUser,
	UserListResponse,
	UnlinkedUserListResponse,
} from "@/types/organization";

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
		const error = {
			code: data.code || response.status,
			message: data.message || "请求失败",
			detail: data.detail,
		};
		throw error;
	}

	// Check if the API returned an error in the response body
	if (data.code !== 0) {
		const error = {
			code: data.code,
			message: data.message || "请求失败",
			detail: data.detail,
		};
		throw error;
	}

	return data as ApiResponse<T>;
}

// ============================================================
// Organization Unit API
// ============================================================

/**
 * Get organization units as tree structure
 * GET /api/v1/org-units/tree
 */
export async function getOrgUnitTree(
	status?: string,
): Promise<OrgUnitTreeItem[]> {
	const params = status ? `?status=${status}` : "";
	const response = await apiFetch<OrgUnitTreeItem[]>(
		`/api/v1/org-units/tree${params}`,
	);
	return response.data || [];
}

/**
 * Get organization units list (flat)
 * GET /api/v1/org-units
 */
export async function getOrgUnits(status?: string): Promise<OrgUnitResponse[]> {
	const params = status ? `?status=${status}` : "";
	const response = await apiFetch<OrgUnitResponse[]>(
		`/api/v1/org-units${params}`,
	);
	return response.data || [];
}

/**
 * Get organization unit by ID
 * GET /api/v1/org-units/{unit_id}
 */
export async function getOrgUnit(
	unitId: number,
): Promise<OrgUnitResponse | null> {
	const response = await apiFetch<OrgUnitResponse>(
		`/api/v1/org-units/${unitId}`,
	);
	return response.data;
}

/**
 * Create organization unit
 * POST /api/v1/org-units
 */
export async function createOrgUnit(
	data: OrgUnitCreateRequest,
): Promise<OrgUnitResponse> {
	const response = await apiFetch<OrgUnitResponse>("/api/v1/org-units", {
		method: "POST",
		body: JSON.stringify(data),
	});
	return response.data;
}

/**
 * Update organization unit
 * PUT /api/v1/org-units/{unit_id}
 */
export async function updateOrgUnit(
	unitId: number,
	data: OrgUnitUpdateRequest,
): Promise<OrgUnitResponse> {
	const response = await apiFetch<OrgUnitResponse>(
		`/api/v1/org-units/${unitId}`,
		{
			method: "PUT",
			body: JSON.stringify(data),
		},
	);
	return response.data;
}

/**
 * Update organization unit status
 * PATCH /api/v1/org-units/{unit_id}/status
 */
export async function updateOrgUnitStatus(
	unitId: number,
	data: OrgUnitStatusUpdateRequest,
): Promise<OrgUnitResponse> {
	const response = await apiFetch<OrgUnitResponse>(
		`/api/v1/org-units/${unitId}/status`,
		{
			method: "PATCH",
			body: JSON.stringify(data),
		},
	);
	return response.data;
}

/**
 * Delete organization unit
 * DELETE /api/v1/org-units/{unit_id}
 */
export async function deleteOrgUnit(unitId: number): Promise<void> {
	await apiFetch<void>(`/api/v1/org-units/${unitId}`, {
		method: "DELETE",
	});
}

/**
 * Get children organization units
 * GET /api/v1/org-units/{unit_id}/children
 */
export async function getChildrenUnits(
	unitId: number,
): Promise<OrgUnitResponse[]> {
	const response = await apiFetch<OrgUnitResponse[]>(
		`/api/v1/org-units/${unitId}/children`,
	);
	return response.data || [];
}

/**
 * Get root organization units (top-level)
 * GET /api/v1/org-units/roots
 */
export async function getRootOrgUnits(
	status?: string,
): Promise<OrgUnitResponse[]> {
	const params = status ? `?status=${status}` : "";
	const response = await apiFetch<OrgUnitResponse[]>(
		`/api/v1/org-units/roots${params}`,
	);
	return response.data || [];
}

// ============================================================
// Employee API
// ============================================================

/**
 * Get employee list (paginated)
 * GET /api/v1/employees
 */
export async function getEmployees(params?: {
	page?: number;
	page_size?: number;
	unit_id?: number;
	status?: string;
	search?: string;
}): Promise<{
	list: EmployeeResponse[];
	total: number;
	page: number;
	page_size: number;
}> {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set("page", String(params.page));
	if (params?.page_size)
		searchParams.set("page_size", String(params.page_size));
	if (params?.unit_id) searchParams.set("unit_id", String(params.unit_id));
	if (params?.status) searchParams.set("status", params.status);
	if (params?.search) searchParams.set("search", params.search);

	const query = searchParams.toString();
	const response = await apiFetch<EmployeeListResponse>(
		`/api/v1/employees${query ? `?${query}` : ""}`,
	);
	return {
		list: response.data?.list || [],
		total: response.data?.total || 0,
		page: response.data?.page || 1,
		page_size: response.data?.page_size || 20,
	};
}

/**
 * Get employee by ID
 * GET /api/v1/employees/{employee_id}
 */
export async function getEmployee(
	employeeId: number,
): Promise<EmployeeResponse | null> {
	const response = await apiFetch<EmployeeResponse>(
		`/api/v1/employees/${employeeId}`,
	);
	return response.data;
}

/**
 * Create employee
 * POST /api/v1/employees
 */
export async function createEmployee(
	data: EmployeeCreateRequest,
): Promise<EmployeeResponse> {
	const response = await apiFetch<EmployeeResponse>("/api/v1/employees", {
		method: "POST",
		body: JSON.stringify(data),
	});
	return response.data;
}

/**
 * Update employee
 * PUT /api/v1/employees/{employee_id}
 */
export async function updateEmployee(
	employeeId: number,
	data: EmployeeUpdateRequest,
): Promise<EmployeeResponse> {
	const response = await apiFetch<EmployeeResponse>(
		`/api/v1/employees/${employeeId}`,
		{
			method: "PUT",
			body: JSON.stringify(data),
		},
	);
	return response.data;
}

/**
 * Delete employee
 * DELETE /api/v1/employees/{employee_id}
 */
export async function deleteEmployee(employeeId: number): Promise<void> {
	await apiFetch<void>(`/api/v1/employees/${employeeId}`, {
		method: "DELETE",
	});
}

/**
 * Transfer employee
 * POST /api/v1/employees/{employee_id}/transfer
 */
export async function transferEmployee(
	employeeId: number,
	data: EmployeeTransferRequest,
): Promise<void> {
	await apiFetch<void>(`/api/v1/employees/${employeeId}/transfer`, {
		method: "POST",
		body: JSON.stringify(data),
	});
}

/**
 * Get employee transfer history
 * GET /api/v1/employees/{employee_id}/transfers
 */
export async function getTransferHistory(
	employeeId: number,
): Promise<unknown[]> {
	const response = await apiFetch<unknown[]>(
		`/api/v1/employees/${employeeId}/transfers`,
	);
	return response.data || [];
}

// ============================================================
// User API (for employee mapping)
// ============================================================

/**
 * Get user list with link status
 * GET /api/v1/admin/users
 */
export async function getUsers(params?: {
	page?: number;
	page_size?: number;
	search?: string;
}): Promise<{
	list: UserListItem[];
	total: number;
	page: number;
	page_size: number;
}> {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set("page", String(params.page));
	if (params?.page_size)
		searchParams.set("page_size", String(params.page_size));
	if (params?.search) searchParams.set("search", params.search);

	const query = searchParams.toString();
	const response = await apiFetch<UserListResponse>(
		`/api/v1/admin/users${query ? `?${query}` : ""}`,
	);
	return {
		list: response.data?.list || [],
		total: response.data?.total || 0,
		page: response.data?.page || 1,
		page_size: response.data?.page_size || 20,
	};
}

/**
 * Get user by ID with link status
 * GET /api/v1/admin/users/{user_id}
 */
export async function getUser(userId: number): Promise<UserListItem | null> {
	const response = await apiFetch<UserListItem>(
		`/api/v1/admin/users/${userId}`,
	);
	return response.data;
}

/**
 * Get unlinked user list (for employee creation)
 * GET /api/v1/admin/users/unlinked
 */
export async function getUnlinkedUsers(params?: {
	page?: number;
	page_size?: number;
	search?: string;
}): Promise<{
	list: UnlinkedUser[];
	total: number;
	page: number;
	page_size: number;
}> {
	const searchParams = new URLSearchParams();
	if (params?.page) searchParams.set("page", String(params.page));
	if (params?.page_size)
		searchParams.set("page_size", String(params.page_size));
	if (params?.search) searchParams.set("search", params.search);

	const query = searchParams.toString();
	const response = await apiFetch<UnlinkedUserListResponse>(
		`/api/v1/admin/users/unlinked${query ? `?${query}` : ""}`,
	);
	return {
		list: response.data?.list || [],
		total: response.data?.total || 0,
		page: response.data?.page || 1,
		page_size: response.data?.page_size || 20,
	};
}

// ============================================================
// Dashboard Stats
// ============================================================

/**
 * Get organization dashboard stats
 */
export async function getDashboardStats(): Promise<OrgDashboardStats> {
	// Fetch org tree and employee list to calculate stats
	const [orgTree, employees] = await Promise.all([
		getOrgUnitTree(),
		getEmployees({ page_size: 1 }),
	]);

	// Calculate org count from tree
	const countOrgUnits = (nodes: OrgUnitTreeItem[]): number => {
		let count = 0;
		for (const node of nodes) {
			count++;
			if (node.children.length > 0) {
				count += countOrgUnits(node.children);
			}
		}
		return count;
	};

	return {
		org_count: countOrgUnits(orgTree),
		total_employees: employees.total,
		on_job: 0, // Will be calculated from employees
		onboarding: 0,
	};
}

// ============================================================
// Error Helper
// ============================================================
// Error messages mapping
export function getErrorMessage(code: number): string {
	const messages: Record<number, string> = {
		0: "成功",
		1001: "参数错误",
		1002: "密码错误",
		1003: "验证码错误",
		1004: "验证码已过期",
		// User-Employee Mapping errors (overrides old user errors)
		2001: "用户不存在或已关联到其他员工",
		2002: "用户未关联到任何员工",
		2003: "手机号与用户信息不一致",
		9001: "服务器内部错误",
	};
	return messages[code] || "请求失败，请稍后重试";
}
