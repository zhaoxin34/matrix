/**
 * Recording API client.
 *
 * Mirrors backend endpoints in `design/docs/technical/workspaces/recording.md`:
 * - GET    /api/v1/workspaces/{code}/recordings
 * - POST   /api/v1/workspaces/{code}/recordings
 * - GET    /api/v1/workspaces/{code}/recordings/{uid}
 * - PUT    /api/v1/workspaces/{code}/recordings/{uid}
 * - DELETE /api/v1/workspaces/{code}/recordings/{uid}
 * - POST   /api/v1/workspaces/{code}/recordings/{uid}/complete
 * - POST   /api/v1/workspaces/{code}/recordings/batch/tags
 * - DELETE /api/v1/workspaces/{code}/recordings/batch
 * - GET    /api/v1/workspaces/{code}/recordings/{uid}/segments
 * - GET    /api/v1/workspaces/{code}/recordings/{uid}/segments/{segUid}
 * - POST   /api/v1/workspaces/{code}/recordings/{uid}/segments
 * - POST   /api/v1/workspaces/{code}/recordings/{uid}/segments/presigned
 * - PUT    /api/v1/workspaces/{code}/recordings/{uid}/segments/{segUid}/bytes
 * - GET    /api/v1/workspaces/{code}/recordings/{uid}/segments/{segUid}/bytes
 * - POST   /api/v1/workspaces/{code}/recordings/{uid}/segments/{segUid}/download-url
 */

import type {
	ApiOk,
	CreateRecordingInput,
	PresignedUrlRequest,
	PresignedUrlResponse,
	SegmentCreateInput,
	SegmentCreateResponse,
	UpdateRecordingInput,
} from "@/lib/recording/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getAuthToken(): string | null {
	if (typeof window === "undefined") return null;
	const raw = localStorage.getItem("neo-auth");
	if (!raw) return null;
	try {
		return JSON.parse(raw)?.state?.user?.token ?? null;
	} catch {
		return null;
	}
}

async function apiFetch<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const token = getAuthToken();
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		},
		credentials: "include",
	});

	// The backend wraps errors in ApiResponse with HTTP 200 and a `code` field
	// (see app/core/exceptions.py). We need to handle both shapes: the
	// normal JSON envelope and the raw-bytes download endpoint.
	const contentType = response.headers.get("content-type") || "";
	if (!contentType.includes("application/json")) {
		if (!response.ok) {
			throw {
				code: response.status,
				message: `HTTP ${response.status}: ${response.statusText}`,
			};
		}
		return (await response.text()) as unknown as T;
	}

	const data = (await response.json()) as
		| ApiOk<T>
		| { code: number; message: string; detail?: string };

	if (!response.ok) {
		throw {
			code: response.status,
			message: `HTTP ${response.status}: ${response.statusText}`,
		};
	}
	if ("code" in data && data.code !== 0) {
		throw { code: data.code, message: data.message };
	}
	return (data as ApiOk<T>).data;
}

// ==================== Frontend-side types ====================
//
// These mirror the backend response shapes in
// `backend/src/app/schemas/recording.py`.

export type RecordingStatus = "recording" | "completed" | "failed";
export type RecordingSource = "agent" | "upload";

export interface Recording {
	uid: string;
	name: string;
	tags: string[];
	status: RecordingStatus;
	enter_url: string | null;
	exit_url: string | null;
	total_duration: number;
	total_size: number;
	source: RecordingSource;
	segment_count: number;
	created_at: string;
}

export interface RecordingDetail extends Recording {
	segments: Segment[];
}

export interface Segment {
	uid: string;
	sequence: number;
	start_time: string;
	end_time: string | null;
	page_urls: string[];
	size: number;
	storage_key?: string;
}

export interface ListRecordingsResponse {
	items: Recording[];
	total: number;
	page: number;
	page_size: number;
}

// ==================== Recording CRUD ====================

export async function listRecordings(
	workspaceCode: string,
	params: {
		search?: string;
		tags?: string[];
		status?: RecordingStatus;
		from_date?: string;
		to_date?: string;
		sort?: string;
		order?: "asc" | "desc";
		page?: number;
		size?: number;
	} = {},
): Promise<ListRecordingsResponse> {
	const q = new URLSearchParams();
	if (params.search) q.set("q", params.search);
	if (params.tags?.length) q.set("tags", params.tags.join(","));
	if (params.status) q.set("status", params.status);
	if (params.from_date) q.set("from", params.from_date);
	if (params.to_date) q.set("to", params.to_date);
	if (params.sort) q.set("sort", params.sort);
	if (params.order) q.set("order", params.order);
	if (params.page) q.set("page", String(params.page));
	if (params.size) q.set("size", String(params.size));
	const qs = q.toString();
	return apiFetch(
		`/api/v1/workspaces/${workspaceCode}/recordings${qs ? `?${qs}` : ""}`,
	);
}

export async function getRecording(
	workspaceCode: string,
	uid: string,
): Promise<RecordingDetail> {
	return apiFetch(`/api/v1/workspaces/${workspaceCode}/recordings/${uid}`);
}

export async function createRecording(
	workspaceCode: string,
	input: CreateRecordingInput = {},
): Promise<Recording> {
	return apiFetch(`/api/v1/workspaces/${workspaceCode}/recordings`, {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export async function updateRecording(
	workspaceCode: string,
	uid: string,
	input: UpdateRecordingInput,
): Promise<Recording> {
	return apiFetch(`/api/v1/workspaces/${workspaceCode}/recordings/${uid}`, {
		method: "PUT",
		body: JSON.stringify(input),
	});
}

export async function deleteRecording(
	workspaceCode: string,
	uid: string,
): Promise<void> {
	return apiFetch(`/api/v1/workspaces/${workspaceCode}/recordings/${uid}`, {
		method: "DELETE",
	});
}

export async function completeRecording(
	workspaceCode: string,
	uid: string,
	exitUrl: string,
): Promise<Recording> {
	return apiFetch(
		`/api/v1/workspaces/${workspaceCode}/recordings/${uid}/complete`,
		{ method: "POST", body: JSON.stringify({ exit_url: exitUrl }) },
	);
}

// ==================== Batch ====================

export async function batchUpdateTags(
	workspaceCode: string,
	uids: string[],
	action: "add" | "remove",
	tags: string[],
): Promise<{ updated: number }> {
	return apiFetch(`/api/v1/workspaces/${workspaceCode}/recordings/batch/tags`, {
		method: "POST",
		body: JSON.stringify({ uids, action, tags }),
	});
}

export async function batchDelete(
	workspaceCode: string,
	uids: string[],
): Promise<{ deleted: number }> {
	return apiFetch(`/api/v1/workspaces/${workspaceCode}/recordings/batch`, {
		method: "DELETE",
		body: JSON.stringify({ uids }),
	});
}

// ==================== Segments ====================

export async function listSegments(
	workspaceCode: string,
	uid: string,
): Promise<Segment[]> {
	return apiFetch(
		`/api/v1/workspaces/${workspaceCode}/recordings/${uid}/segments`,
	);
}

export async function getSegment(
	workspaceCode: string,
	uid: string,
	segmentUid: string,
): Promise<Segment> {
	return apiFetch(
		`/api/v1/workspaces/${workspaceCode}/recordings/${uid}/segments/${segmentUid}`,
	);
}

export async function addSegment(
	workspaceCode: string,
	uid: string,
	input: SegmentCreateInput,
): Promise<SegmentCreateResponse> {
	return apiFetch(
		`/api/v1/workspaces/${workspaceCode}/recordings/${uid}/segments`,
		{ method: "POST", body: JSON.stringify(input) },
	);
}

export async function uploadSegmentBytes(
	workspaceCode: string,
	uid: string,
	segmentUid: string,
	body: string,
	contentType: string = "application/json",
): Promise<{ storage_key: string; size: number }> {
	return apiFetch(
		`/api/v1/workspaces/${workspaceCode}/recordings/${uid}/segments/${segmentUid}/bytes`,
		{
			method: "PUT",
			body,
			headers: { "Content-Type": contentType },
		},
	);
}

/**
 * Download a segment's bytes through the backend (bypasses rustfs CORS).
 * Returns the raw JSON event array as a string.
 *
 * NOTE: this endpoint intentionally returns raw bytes (not the
 * ApiResponse envelope) so the rrweb player can feed it directly. It
 * uses plain `fetch` rather than the `apiFetch` wrapper.
 */
export async function downloadSegmentBytes(
	workspaceCode: string,
	uid: string,
	segmentUid: string,
): Promise<string> {
	const token = getAuthToken();
	const response = await fetch(
		`${API_BASE_URL}/api/v1/workspaces/${workspaceCode}/recordings/${uid}/segments/${segmentUid}/bytes`,
		{
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			credentials: "include",
		},
	);
	if (!response.ok) {
		throw {
			code: response.status,
			message: `下载 segment 失败：HTTP ${response.status}`,
		};
	}
	return response.text();
}

export async function getPresignedUploadUrl(
	workspaceCode: string,
	uid: string,
	input: PresignedUrlRequest,
): Promise<PresignedUrlResponse> {
	return apiFetch(
		`/api/v1/workspaces/${workspaceCode}/recordings/${uid}/segments/presigned`,
		{ method: "POST", body: JSON.stringify(input) },
	);
}

// ==================== Helpers ====================

/** Coerce an unknown thrown value into a human-readable string. */
export function getErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === "string") return err;
	if (err && typeof err === "object" && "message" in err) {
		return String((err as { message: unknown }).message);
	}
	return String(err);
}
