/**
 * Agent Prototype Types
 * Based on: design/docs/technical/agents/agent-database-design.md
 */

export type AgentPrototypeStatus = "draft" | "enabled" | "disabled";

export interface PromptConfig {
  system?: string;
  user?: string;
  tool?: string;
  [key: string]: string | undefined;
}

export interface AgentPrototypeVersion {
  id: number;
  agent_prototype_id: number;
  version: string;
  prompts_snapshot: PromptConfig;
  config_snapshot: Record<string, unknown>;
  change_summary: string | null;
  created_by: number;
  created_at: string;
}

export interface AgentPrototype {
  id: number;
  code: string;
  name: string;
  description: string | null;
  version: string | null;
  model: string;
  prompts: PromptConfig;
  status: AgentPrototypeStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  // 计算字段（可能来自关联查询）
  versions?: AgentPrototypeVersion[];
  created_by_name?: string;
}

export interface AgentPrototypeListResponse {
  code: number;
  message: string;
  data: {
    list: AgentPrototype[];
    total: number;
    page: number;
    page_size: number;
  };
}

export interface AgentPrototypeDetailResponse {
  code: number;
  message: string;
  data: AgentPrototype;
}

export interface VersionsResponse {
  code: number;
  message: string;
  data: {
    list: AgentPrototypeVersion[];
    total: number;
  };
}
