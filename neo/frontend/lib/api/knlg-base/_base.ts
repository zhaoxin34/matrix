/**
 * knlg-base API client base helpers.
 */

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

	const data: ApiResponse<T> = await response.json();

	if (!response.ok || data.code !== 0) {
		throw {
			code: data.code || response.status,
			message: data.message || "Request failed",
		};
	}

	return data.data as T;
}

export async function knlgGet<T>(path: string): Promise<T> {
	return apiFetch<T>(path, { method: "GET" });
}

export async function knlgPost<T>(path: string, body?: unknown): Promise<T> {
	return apiFetch<T>(path, {
		method: "POST",
		body: body ? JSON.stringify(body) : undefined,
	});
}

export async function knlgPut<T>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export async function knlgPatch<T>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, {
		method: "PATCH",
		body: JSON.stringify(body),
	});
}

export async function knlgDelete<T = null>(path: string): Promise<T> {
	return apiFetch<T>(path, { method: "DELETE" });
}

// Multipart upload for documents
export async function knlgUpload<T>(
	path: string,
	formData: FormData,
): Promise<T> {
	const rawToken =
		typeof window !== "undefined" ? localStorage.getItem("neo-auth") : null;
	const parsed = rawToken ? JSON.parse(rawToken) : null;
	const token = parsed?.user?.token ?? parsed?.state?.user?.token ?? null;

	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: "POST",
		body: formData,
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		credentials: "include",
	});

	const data: ApiResponse<T> = await response.json();
	if (!response.ok || data.code !== 0) {
		throw { code: data.code, message: data.message || "Upload failed" };
	}
	return data.data as T;
}

export function knlgBasePath(workspaceCode: string, suffix = ""): string {
	return `/api/v1/workspaces/${workspaceCode}/knlg-base${suffix}`;
}

// ==================== Type Definitions ====================

export interface KnowledgeCard {
	id: number;
	title: string;
	statement: string;
	domain: string;
	tags: string[] | null;
	type: string;
	key_signals: string[] | null;
	conditions: string | null;
	exceptions: string | null;
	confidence: number;
	validation_status: string;
	status: string;
	version: string;
	published_at: string | null;
	workspace_id: number;
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface KnowledgeCardListResponse {
	items: KnowledgeCard[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
}

export interface KnowledgeCardCreate {
	title: string;
	statement: string;
	domain: string;
	type: string;
	tags?: string[];
	key_signals?: string[];
	conditions?: string;
	exceptions?: string;
	confidence?: number;
	source_turn_ids?: number[];
	source_doc_ids?: number[];
	expert_ids?: number[];
}

export interface KnowledgeCardUpdate {
	title?: string;
	statement?: string;
	domain?: string;
	type?: string;
	tags?: string[];
	key_signals?: string[];
	conditions?: string;
	exceptions?: string;
	confidence?: number;
}

export interface QuestionTree {
	id: number;
	name: string;
	domain: string;
	description: string | null;
	questions: Array<{ id: string; text: string; followups?: string[] }>;
	version: string;
	is_active: boolean;
	workspace_id: number;
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface Question {
	id: number;
	text: string;
	domain: string;
	tags: string[] | null;
	parent_question_id: number | null;
	tree_id: number | null;
	priority: number;
	status: string;
	workspace_id: number;
	interview_count?: number;
	created_at: string;
	updated_at: string;
}

export interface Interview {
	id: number;
	session_id: number;
	question_id: number;
	expert_id: number;
	mode: string;
	summary: string | null;
	started_at: string | null;
	ended_at: string | null;
	turns?: InterviewTurn[];
}

export interface InterviewSession {
	id: number;
	expert_id: number;
	topic: string;
	mode: string;
	started_at: string | null;
	ended_at: string | null;
	interviews?: Interview[];
}

export interface InterviewTurn {
	id: number;
	interview_id: number;
	sequence: number;
	question: string;
	answer: string;
	type: string;
	confidence: number;
	parent_turn_id: number | null;
	tags: string[] | null;
	metadata_?: Record<string, unknown> | null;
}

export interface Rule {
	id: number;
	name: string;
	description: string | null;
	source_kc_id: number;
	scope: Record<string, unknown>;
	trigger: Record<string, unknown>;
	conditions: Array<Record<string, unknown>>;
	conclusion: Record<string, unknown>;
	exceptions: Array<Record<string, unknown>> | null;
	confidence: number;
	version: string;
	status: string;
	published_at: string | null;
	workspace_id: number;
	created_by: number;
	created_at: string;
	updated_at: string;
}

export interface Document {
	id: number;
	name: string;
	type: string;
	source_url: string | null;
	file_path: string | null;
	file_size: number | null;
	hash: string | null;
	workspace_id: number;
	imported_by: number;
	imported_at: string;
	import_job_count?: number;
}

export interface ImportJob {
	id: number;
	document_id: number;
	status: string;
	progress: number;
	started_at: string | null;
	finished_at: string | null;
	result_summary: Record<string, unknown> | null;
	error_message: string | null;
	workspace_id: number;
	created_at: string;
	updated_at: string;
}

export interface SourceRef {
	id: number;
	kc_id: number;
	source_type: string;
	source_id: number;
	source_excerpt: string | null;
	contribution_weight: number;
	workspace_id: number;
	created_at: string;
}
