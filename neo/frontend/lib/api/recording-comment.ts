/**
 * Recording Segment Comment API client.
 *
 * Mirrors backend endpoints in
 * `backend/src/app/api/v1/recording_segment_comments.py`:
 * - POST   /api/v1/workspaces/{code}/recordings/{uid}/segment-comments
 * - GET    /api/v1/workspaces/{code}/recordings/{uid}/segment-comments
 * - GET    /api/v1/workspaces/{code}/recordings/{uid}/segments/{segUid}/comments
 * - PUT    /api/v1/workspaces/{code}/recordings/{uid}/segment-comments/{cmtUid}
 * - DELETE /api/v1/workspaces/{code}/recordings/{uid}/segment-comments/{cmtUid}
 * - DELETE /api/v1/workspaces/{code}/recordings/{uid}/segment-comments/batch
 */

import type { ApiOk } from "@/lib/recording/types";
import type {
  BatchDeleteCommentsResponse,
  CreateCommentInput,
  ListCommentsResponse,
  SegmentComment,
  UpdateCommentInput,
} from "@/lib/recording/types";

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
    throw { code: response.status, message: response.statusText };
  }
  if ("code" in data && data.code !== 0) {
    throw { code: data.code, message: data.message };
  }
  return (data as ApiOk<T>).data;
}

// ==================== CRUD ====================

/**
 * Create a comment on a segment.
 * Requires Admin or Owner role in the workspace.
 */
export async function createComment(
  workspaceCode: string,
  recordingUid: string,
  input: CreateCommentInput,
): Promise<SegmentComment> {
  return apiFetch(
    `/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/segment-comments`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

/**
 * List comments of a recording with optional filters.
 */
export async function listCommentsByRecording(
  workspaceCode: string,
  recordingUid: string,
  params: {
    segment_uid?: string;
    creator_id?: number;
    sort?: "show_time" | "created_at";
    order?: "asc" | "desc";
    page?: number;
    size?: number;
  } = {},
): Promise<ListCommentsResponse> {
  const q = new URLSearchParams();
  if (params.segment_uid) q.set("segment_uid", params.segment_uid);
  if (params.creator_id !== undefined)
    q.set("creator_id", String(params.creator_id));
  if (params.sort) q.set("sort", params.sort);
  if (params.order) q.set("order", params.order);
  if (params.page) q.set("page", String(params.page));
  if (params.size) q.set("size", String(params.size));
  const qs = q.toString();
  return apiFetch(
    `/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/segment-comments${
      qs ? `?${qs}` : ""
    }`,
  );
}

/**
 * List all comments of a single segment, sorted by show_time asc.
 */
export async function listCommentsBySegment(
  workspaceCode: string,
  recordingUid: string,
  segmentUid: string,
): Promise<SegmentComment[]> {
  return apiFetch(
    `/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/segments/${segmentUid}/comments`,
  );
}

/**
 * Update a comment. Only the creator or workspace Owner may succeed.
 */
export async function updateComment(
  workspaceCode: string,
  recordingUid: string,
  commentUid: string,
  input: UpdateCommentInput,
): Promise<SegmentComment> {
  return apiFetch(
    `/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/segment-comments/${commentUid}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

/**
 * Delete a single comment. Only the creator or workspace Owner may succeed.
 */
export async function deleteComment(
  workspaceCode: string,
  recordingUid: string,
  commentUid: string,
): Promise<void> {
  return apiFetch(
    `/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/segment-comments/${commentUid}`,
    { method: "DELETE" },
  );
}

/**
 * Batch delete comments. Items the user cannot delete are returned in
 * `skipped`. Used by the side-panel multi-select flow.
 */
export async function batchDeleteComments(
  workspaceCode: string,
  recordingUid: string,
  commentUids: string[],
): Promise<BatchDeleteCommentsResponse> {
  return apiFetch(
    `/api/v1/workspaces/${workspaceCode}/recordings/${recordingUid}/segment-comments/batch`,
    {
      method: "DELETE",
      body: JSON.stringify({ comment_uids: commentUids }),
    },
  );
}
