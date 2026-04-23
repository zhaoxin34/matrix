export type SkillLevel = "Planning" | "Functional" | "Atomic";

export interface Skill {
  id: number;
  code: string;
  name: string;
  level: SkillLevel;
  tags: string[] | null;
  author: string | null;
  content: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillListResponse {
  items: Skill[];
  total: number;
  page: number;
  page_size: number;
}

export interface SkillCreate {
  code: string;
  name: string;
  level: SkillLevel;
  tags?: string[];
  author?: string;
  content: string;
}

export interface SkillUpdate {
  name?: string;
  level?: SkillLevel;
  tags?: string[];
  author?: string;
  content?: string;
}