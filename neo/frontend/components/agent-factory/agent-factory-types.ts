/**
 * Agent Types
 * Based on: design/docs/product/workspaces/agent-factory.md
 *            design/docs/technical/agents/agent-database-design.md
 */

export type AgentStatus = "enabled" | "disabled" | "deleted";

export type ThinkingLevel = "low" | "medium" | "high";

export type BackoffStrategy = "linear" | "exponential";

export interface RetryConfig {
  max_attempts: number;
  backoff: BackoffStrategy;
}

export interface AgentConfig {
  temperature: number;
  max_tokens: number;
  thinking: ThinkingLevel;
  timeout: number;
  retry: RetryConfig;
}

/**
 * Skill Types with Version Support
 */
export interface SkillVersion {
  id: number;
  version: string;
  change_summary: string | null;
  created_at: string;
}

// 简单的技能（用于已选中的技能列表）
export interface Skill {
  id: number;
  code: string;
  name: string;
}

// 带有版本信息的技能（用于选择界面）
export interface SkillWithVersions {
  id: number;
  code: string;
  name: string;
  current_version: string;
  versions: SkillVersion[];
}

// 已选中的技能（带版本）
export interface SelectedSkill {
  skill_id: number;
  code: string;
  name: string;
  selected_version: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string | null;
  prototype_id: number;
  prototype_version: string;
  workspace_id: number;
  workspace_name?: string;
  model: string;
  skills: Skill[];
  config: AgentConfig;
  status: AgentStatus;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  // 关联的 Prototype 信息
  prototype: {
    id: number;
    code: string;
    name: string;
    version: string;
  } | null;
}

export interface AgentListResponse {
  code: number;
  message: string;
  data: {
    list: Agent[];
    total: number;
    page: number;
    page_size: number;
  };
}

export interface AgentDetailResponse {
  code: number;
  message: string;
  data: Agent;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  prototype_id: number;
  prototype_version?: string;
  model?: string;
  skills?: number[];
  config?: Partial<AgentConfig>;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  model?: string;
  skills?: number[];
  config?: Partial<AgentConfig>;
  status?: AgentStatus;
}

/**
 * Prototype Version
 */
export interface PrototypeVersion {
  id: number;
  version: string;
  change_summary: string | null;
  created_at: string;
}

/**
 * 可选择的 Prototype（仅 enabled 状态）
 */
export interface SelectablePrototype {
  id: number;
  code: string;
  name: string;
  description: string | null;
  current_version: string;
  versions: PrototypeVersion[];
  model: string;
}

export interface SelectablePrototypeResponse {
  code: number;
  message: string;
  data: SelectablePrototype[];
}
