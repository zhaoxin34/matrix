/**
 * Recording API client.
 *
 * Mirrors the backend endpoints defined in `design/docs/technical/workspaces/recording.md`:
 * - POST   /api/v1/workspaces/{code}/recordings
 * - PUT    /api/v1/workspaces/{code}/recordings/{uid}
 * - POST   /api/v1/workspaces/{code}/recordings/{uid}/segments/presigned
 * - POST   /api/v1/workspaces/{code}/recordings/{uid}/segments
 * - PUT    <presigned upload URL>   (raw S3 PUT, no auth header)
 */

import type {
	ApiOk,
	CreateRecordingInput,
	PresignedUrlRequest,
	PresignedUrlResponse,
	SegmentCreateInput,
	SegmentCreateResponse,
	UpdateRecordingInput,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getAuthToken(): string | null {
	if (typeof window === "undefined") return null;
	const raw = localStorage.getItem("neo-auth");
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		// Support both zustand persist structure ({ user: { token } }) and nested structure ({ state: { user: { token } } })
		return parsed?.user?.token ?? parsed?.state?.user?.token ?? null;
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

	const data = (await response.json()) as
		| ApiOk<T>
		| { code: number; message: string };

	if (!response.ok) {
		throw {
			code: response.status,
			message: `HTTP ${response.status}: ${response.statusText}`,
		};
	}
	if (data.code !== 0) {
		throw { code: data.code, message: data.message };
	}
	return (data as ApiOk<T>).data;
}

/**
 * Create a new Recording in `recording` status.
 * POST /api/v1/workspaces/{workspaceCode}/recordings
 */
export async function createRecording(
	workspaceCode: string,
	input: CreateRecordingInput = {},
): Promise<{ uid: string; name: string; status: string }> {
	return apiFetch(`/api/v1/workspaces/${workspaceCode}/recordings`, {
		method: "POST",
		body: JSON.stringify(input),
	});
}

/**
 * Update a Recording — used at stop time to mark it completed and set totals.
 * PUT /api/v1/workspaces/{workspaceCode}/recordings/{uid}
 */
export async function updateRecording(
	workspaceCode: string,
	uid: string,
	input: UpdateRecordingInput,
): Promise<unknown> {
	return apiFetch(`/api/v1/workspaces/${workspaceCode}/recordings/${uid}`, {
		method: "PUT",
		body: JSON.stringify(input),
	});
}

/**
 * Ask the backend for a presigned S3 URL good for one PUT.
 * POST /api/v1/workspaces/{workspaceCode}/recordings/{uid}/segments/presigned
 */
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

/**
 * Register a segment in the DB after the bytes have been PUT to S3.
 * POST /api/v1/workspaces/{workspaceCode}/recordings/{uid}/segments
 */
export async function addSegment(
	workspaceCode: string,
	uid: string,
	input: SegmentCreateInput,
): Promise<SegmentCreateResponse> {
	return apiFetch(
		`/api/v1/workspaces/${workspaceCode}/recordings/${uid}/segments`,
		{
			method: "POST",
			body: JSON.stringify(input),
		},
	);
}

/**
 * Upload bytes to a presigned URL. Does NOT use the API base URL — the URL
 * is fully qualified. No auth header is sent (S3 signature is in the URL).
 *
 * NOTE: kept for the day rustfs implements PutBucketCors (issue #1386).
 * Today, browsers cannot PUT directly to RustFS due to missing CORS support,
 * so callers should use {@link uploadSegmentBytes} instead.
 */
export async function uploadToPresignedUrl(
	presignedUrl: string,
	body: Blob | string,
	contentType: string,
): Promise<void> {
	const response = await fetch(presignedUrl, {
		method: "PUT",
		body,
		headers: { "Content-Type": contentType },
	});
	if (!response.ok) {
		throw {
			code: response.status,
			message: `S3 PUT failed: ${response.status} ${response.statusText}`,
		};
	}
}

/**
 * Upload segment bytes through the backend, which then streams them to S3
 * via boto3. This is the path the frontend uses today because rustfs does
 * not yet implement PutBucketCors (rustfs/rustfs#1386) and browsers refuse
 * to PUT directly to a presigned URL.
 *
 * PUT /api/v1/workspaces/{workspaceCode}/recordings/{uid}/segments/{segmentUid}/bytes
 */
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
