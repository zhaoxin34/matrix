// ============================================================
// Skill Types
// ============================================================

export type SkillLevel = "Planning" | "Functional" | "Atomic";
export type SkillStatus = "draft" | "active" | "disabled";

// Skill entity
export interface Skill {
  id: number;
  code: string;
  name: string;
  level: SkillLevel;
  tags: string[];
  status: SkillStatus;
  file_count?: number;
  version_count?: number;
  draft_snapshot?: Array<{ file_metadata_id: number; file_id: number }>;
  create_user_id?: number;
  created_at: string;
  updated_at: string;
}

// API request types
export interface SkillCreateInput {
  code: string;
  name: string;
  level: SkillLevel;
  tags?: string[];
}

export interface SkillUpdateInput {
  name?: string;
  level?: SkillLevel;
  tags?: string[];
}

export interface SkillListQuery {
  status?: SkillStatus;
  level?: SkillLevel;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface SkillListResponse {
  items: Skill[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================================
// File Types
// ============================================================

// Backend file tree node format
interface BackendFileNode {
  id: number;
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: BackendFileNode[];
}

// Frontend file tree node format (what components expect)
export interface FileNode {
  id: number;
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  children?: FileNode[];
}

// Convert backend format to frontend format
function convertFileNode(node: BackendFileNode): FileNode {
  return {
    id: node.id,
    name: node.name,
    path: node.path,
    isDir: node.type === "directory",
    size: node.size,
    children: node.children?.map(convertFileNode),
  };
}

// Export converter for use in API layer
export function convertFileTree(tree: BackendFileNode[]): FileNode[] {
  return tree.map(convertFileNode);
}

// File content response
export interface FileContentResponse {
  id: number;
  path: string;
  name: string;
  size: number;
  version: number;
  content: string;
  updated_at?: string;
}

// API request types
export interface FileCreateInput {
  name: string;
  path: string;
  content: string;
}

export interface FileUpdateInput {
  content: string;
}

// ============================================================
// Version Types
// ============================================================

// Skill version
export interface SkillVersion {
  id: number;
  version: string;
  comment: string;
  created_at: string;
  file_count: number;
}

export interface VersionListResponse {
  versions: SkillVersion[];
}

// API request types
export interface PublishInput {
  version: string;
  comment: string;
}

export interface RollbackInput {
  version_id: number;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  traceId?: string;
  timestamp?: number;
}
