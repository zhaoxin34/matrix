/**
 * Skills API Client
 * Handles all skill-related API calls
 */

import type {
  Skill,
  SkillCreateInput,
  SkillUpdateInput,
  SkillListQuery,
  FileNode,
  FileContentResponse,
  FileCreateInput,
  FileUpdateInput,
  SkillVersion,
  PublishInput,
  RollbackInput,
  ApiResponse,
} from "@/components/skills/skills-types";
import { convertFileTree } from "@/components/skills/skills-types";

// Re-export types
export type {
  Skill,
  SkillCreateInput,
  SkillUpdateInput,
  SkillListQuery,
  FileNode,
  FileContentResponse,
  FileCreateInput,
  FileUpdateInput,
  SkillVersion,
  PublishInput,
  RollbackInput,
  SkillStatus,
  SkillLevel,
  ApiResponse,
  convertFileTree,
} from "@/components/skills/skills-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ============================================================
// API Fetch Wrapper
// ============================================================
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // Get auth token from store
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
// Skills API
// ============================================================

/**
 * List skills with pagination and filters
 */
export async function listSkills(
  query?: SkillListQuery,
): Promise<{ skills: Skill[]; total: number }> {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.level) params.set("level", query.level);
  if (query?.search) params.set("search", query.search);
  if (query?.page) params.set("page", String(query.page));
  if (query?.page_size) params.set("page_size", String(query.page_size));

  const endpoint = `/api/v1/skills${params.toString() ? `?${params}` : ""}`;
  const response = await apiFetch<{
    items: Skill[];
    total: number;
    page: number;
    page_size: number;
  }>(endpoint);

  return {
    skills: response.data?.items || [],
    total: response.data?.total || 0,
  };
}

/**
 * Get skill by code
 */
export async function getSkill(code: string): Promise<Skill> {
  // API returns data directly as Skill object: {code:0, data:{id,code,name,...}}
  const response = await apiFetch<Skill>(`/api/v1/skills/${code}`);
  return response.data!;
}

/**
 * Create a new skill
 */
export async function createSkill(input: SkillCreateInput): Promise<Skill> {
  // API returns data directly as Skill object
  const response = await apiFetch<Skill>("/api/v1/skills", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data!;
}

/**
 * Update skill metadata
 */
export async function updateSkill(
  code: string,
  input: SkillUpdateInput,
): Promise<Skill> {
  // API returns data directly as Skill object
  const response = await apiFetch<Skill>(`/api/v1/skills/${code}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data!;
}

/**
 * Delete (soft) skill
 */
export async function deleteSkill(code: string): Promise<void> {
  await apiFetch(`/api/v1/skills/${code}`, {
    method: "DELETE",
  });
}

/**
 * Disable skill
 */
export async function disableSkill(code: string): Promise<Skill> {
  // API returns data directly with {code, status, ...}
  const response = await apiFetch<{ code: string; status: string }>(
    `/api/v1/skills/${code}/disable`,
    {
      method: "POST",
    },
  );
  return response.data as unknown as Skill;
}

/**
 * Enable skill (re-enable disabled skill)
 */
export async function enableSkill(code: string): Promise<Skill> {
  // API returns data directly with {code, status, ...}
  const response = await apiFetch<{ code: string; status: string }>(
    `/api/v1/skills/${code}/enable`,
    {
      method: "POST",
    },
  );
  return response.data as unknown as Skill;
}

// ============================================================
// Files API
// ============================================================

/**
 * Get file tree for a skill
 */
export async function getFileTree(code: string): Promise<FileNode[]> {
  // Define the backend response type
  type BackendFileNode = {
    id: number;
    name: string;
    path: string;
    type: "file" | "directory";
    size?: number;
    children?: BackendFileNode[];
  };
  // API returns data directly with {tree: [...]}
  type FileTreeResponse = { tree: BackendFileNode[] };
  const response = await apiFetch<FileTreeResponse>(
    `/api/v1/skills/${code}/files`,
  );
  // Convert from backend format to frontend format
  return convertFileTree(response.data?.tree || []);
}

/**
 * Get file content
 */
export async function getFileContent(
  code: string,
  path: string,
): Promise<FileContentResponse> {
  // Encode path for URL safety
  const encodedPath = encodeURIComponent(path);
  // API returns data directly with {content: {...}}
  type FileContentWrapper = { content: FileContentResponse };
  const response = await apiFetch<FileContentWrapper>(
    `/api/v1/skills/${code}/files/${encodedPath}`,
  );
  return response.data!.content;
}

/**
 * Create a new file
 */
export async function createFile(
  code: string,
  input: FileCreateInput,
): Promise<{ file_metadata_id: number }> {
  const response = await apiFetch<{ file_metadata_id: number }>(
    `/api/v1/skills/${code}/files`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data!;
}

/**
 * Update file content
 */
export async function updateFile(
  code: string,
  path: string,
  input: FileUpdateInput,
): Promise<void> {
  const encodedPath = encodeURIComponent(path);
  await apiFetch(`/api/v1/skills/${code}/files/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

/**
 * Delete file
 */
export async function deleteFile(code: string, path: string): Promise<void> {
  const encodedPath = encodeURIComponent(path);
  await apiFetch(`/api/v1/skills/${code}/files/${encodedPath}`, {
    method: "DELETE",
  });
}

// ============================================================
// Version API
// ============================================================

/**
 * Get version history
 */
export async function getVersions(code: string): Promise<SkillVersion[]> {
  // API returns data directly with {versions: [...]}
  type VersionsResponse = { versions: SkillVersion[]; total: number };
  const response = await apiFetch<VersionsResponse>(
    `/api/v1/skills/${code}/versions`,
  );
  return response.data?.versions || [];
}

/**
 * Publish skill (create new version)
 */
export async function publishSkill(
  code: string,
  input: PublishInput,
): Promise<SkillVersion> {
  // API returns data directly as version object: {id, skill_id, version, ...}
  type PublishResponse = {
    id: number;
    skill_id: number;
    version: string;
    file_snapshot: unknown[];
    comment: string;
    created_at: string;
  };
  const response = await apiFetch<PublishResponse>(
    `/api/v1/skills/${code}/publish`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data as unknown as SkillVersion;
}

/**
 * Rollback to previous version
 */
export async function rollbackSkill(
  code: string,
  input: RollbackInput,
): Promise<{ skill: Skill }> {
  // API returns data directly: {code, draft_snapshot, rolled_back_version}
  type RollbackResponse = {
    code: string;
    draft_snapshot: unknown[];
    rolled_back_version: string;
  };
  await apiFetch<RollbackResponse>(`/api/v1/skills/${code}/rollback`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  // Return empty - caller should reload skill data
  return { skill: {} as Skill };
}
