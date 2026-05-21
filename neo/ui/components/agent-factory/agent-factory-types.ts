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

export interface Skill {
	id: number;
	code: string;
	name: string;
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
	prototype?: {
		id: number;
		code: string;
		name: string;
		version: string;
	};
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

export interface SelectablePrototype {
	id: number;
	code: string;
	name: string;
	description: string | null;
	version: string;
	model: string;
}

export interface SelectablePrototypeResponse {
	code: number;
	message: string;
	data: SelectablePrototype[];
}
