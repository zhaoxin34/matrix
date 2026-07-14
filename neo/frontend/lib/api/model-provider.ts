/**
 * Model Provider API client
 * Proxies requests to backend API via /api/v1/model-providers
 */

import { getAuthHeaders } from "@/lib/utils/auth";

// API base URL - use frontend proxy in production
const API_BASE = "/api/v1";

// Types matching backend API
export interface ModelProviderResponse {
	id: number;
	code: string;
	name: string;
	description: string | null;
	api_type: string;
	base_url: string | null;
	api_key_env: string | null;
	headers: Record<string, unknown> | null;
	enabled: boolean;
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface ModelProviderListResponse {
	items: ModelProviderResponse[];
	total: number;
	page: number;
	page_size: number;
}

export interface ModelConfigResponse {
	id: number;
	provider_id: number;
	model_id: string;
	display_name: string | null;
	context_window: number;
	max_tokens: number;
	supports_thinking: boolean;
	thinking_level_map: Record<string, unknown> | null;
	input_types: string[];
	enabled: boolean;
	created_at: string;
	updated_at: string;
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

	if (!response.ok) {
		throw new ApiError(
			data.message || "Request failed",
			data.code || response.status,
			response.status,
		);
	}

	if (data.code !== 0) {
		throw new ApiError(data.message, data.code, 200);
	}

	return data.data as T;
}

// ==================== Model Provider API ====================

/**
 * List all model providers
 */
export async function listModelProviders(params?: {
	page?: number;
	page_size?: number;
	enabled?: boolean;
	for_agent?: boolean;
}): Promise<ModelProviderListResponse> {
	const searchParams = new URLSearchParams();

	if (params?.page) searchParams.set("page", params.page.toString());
	if (params?.page_size)
		searchParams.set("page_size", params.page_size.toString());
	if (params?.enabled !== undefined) {
		searchParams.set("enabled", params.enabled.toString());
	}
	if (params?.for_agent) {
		searchParams.set("for_agent", "true");
	}

	const queryString = searchParams.toString();
	const endpoint = `/model-providers${queryString ? `?${queryString}` : ""}`;

	return apiRequest<ModelProviderListResponse>(endpoint);
}

/**
 * Get a single model provider by ID
 */
export async function getModelProvider(
	providerId: number,
): Promise<ModelProviderResponse> {
	return apiRequest<ModelProviderResponse>(`/model-providers/${providerId}`);
}

/**
 * List models under a provider
 */
export async function listProviderModels(
	providerId: number,
	params?: {
		page?: number;
		page_size?: number;
		enabled?: boolean;
	},
): Promise<ModelConfigResponse[]> {
	const searchParams = new URLSearchParams();

	if (params?.page) searchParams.set("page", params.page.toString());
	if (params?.page_size)
		searchParams.set("page_size", params.page_size.toString());
	if (params?.enabled !== undefined) {
		searchParams.set("enabled", params.enabled.toString());
	}

	const queryString = searchParams.toString();
	const endpoint = `/model-providers/${providerId}/models${queryString ? `?${queryString}` : ""}`;

	return apiRequest<ModelConfigResponse[]>(endpoint);
}

/**
 * Get a specific model from a provider
 */
export async function getProviderModel(
	providerId: number,
	modelId: string,
): Promise<ModelConfigResponse> {
	return apiRequest<ModelConfigResponse>(
		`/model-providers/${providerId}/models/${encodeURIComponent(modelId)}`,
	);
}

/**
 * Create a model provider
 */
export interface CreateModelProviderRequest {
	code: string;
	name: string;
	description?: string;
	api_type: string;
	base_url?: string;
	api_key_env?: string;
	headers?: Record<string, unknown>;
}

export async function createModelProvider(
	data: CreateModelProviderRequest,
): Promise<ModelProviderResponse> {
	return apiRequest<ModelProviderResponse>("/model-providers", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

/**
 * Update a model provider
 */
export interface UpdateModelProviderRequest {
	name?: string;
	description?: string;
	api_type?: string;
	base_url?: string;
	api_key_env?: string;
	headers?: Record<string, unknown>;
}

export async function updateModelProvider(
	providerId: number,
	data: UpdateModelProviderRequest,
): Promise<ModelProviderResponse> {
	return apiRequest<ModelProviderResponse>(`/model-providers/${providerId}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

/**
 * Delete a model provider
 */
export async function deleteModelProvider(
	providerId: number,
): Promise<{ message: string }> {
	return apiRequest<{ message: string }>(`/model-providers/${providerId}`, {
		method: "DELETE",
	});
}

/**
 * Enable a model provider
 */
export async function enableModelProvider(
	providerId: number,
): Promise<{ id: number; enabled: boolean; updated_at: string }> {
	return apiRequest<{ id: number; enabled: boolean; updated_at: string }>(
		`/model-providers/${providerId}/enable`,
		{ method: "PATCH" },
	);
}

/**
 * Disable a model provider
 */
export async function disableModelProvider(
	providerId: number,
): Promise<{ id: number; enabled: boolean; updated_at: string }> {
	return apiRequest<{ id: number; enabled: boolean; updated_at: string }>(
		`/model-providers/${providerId}/disable`,
		{ method: "PATCH" },
	);
}

/**
 * Create a model under a provider
 */
export interface CreateModelConfigRequest {
	model_id: string;
	display_name?: string;
	context_window?: number;
	max_tokens?: number;
	supports_thinking?: boolean;
	thinking_level_map?: Record<string, unknown>;
	input_types?: string[];
}

export async function createProviderModel(
	providerId: number,
	data: CreateModelConfigRequest,
): Promise<ModelConfigResponse> {
	return apiRequest<ModelConfigResponse>(
		`/model-providers/${providerId}/models`,
		{
			method: "POST",
			body: JSON.stringify(data),
		},
	);
}

/**
 * Update a model under a provider
 */
export interface UpdateModelConfigRequest {
	display_name?: string;
	context_window?: number;
	max_tokens?: number;
	supports_thinking?: boolean;
	thinking_level_map?: Record<string, unknown>;
	input_types?: string[];
}

export async function updateProviderModel(
	providerId: number,
	modelId: string,
	data: UpdateModelConfigRequest,
): Promise<ModelConfigResponse> {
	return apiRequest<ModelConfigResponse>(
		`/model-providers/${providerId}/models/${encodeURIComponent(modelId)}`,
		{
			method: "PUT",
			body: JSON.stringify(data),
		},
	);
}

/**
 * Delete a model under a provider
 */
export async function deleteProviderModel(
	providerId: number,
	modelId: string,
): Promise<{ message: string }> {
	return apiRequest<{ message: string }>(
		`/model-providers/${providerId}/models/${encodeURIComponent(modelId)}`,
		{ method: "DELETE" },
	);
}
