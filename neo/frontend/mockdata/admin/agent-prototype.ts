// ============================================================
// Types
// ============================================================
import type { PromptConfig } from "@/components/agent-prototype/agent-prototype-types";
import type {
  AgentStatus,
  ThinkingLevel,
} from "@/components/agent-factory/agent-factory-types";

// Re-export for convenience
export type { PromptConfig } from "@/components/agent-prototype/agent-prototype-types";
export type {
  AgentStatus,
  ThinkingLevel,
} from "@/components/agent-factory/agent-factory-types";

export type AgentPrototypeStatus = "draft" | "enabled" | "disabled";

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
}

export interface Agent {
  id: number;
  code: string;
  name: string;
  description: string | null;
  prototype_id: number;
  prototype_version: string;
  workspace_id: number;
  workspace_name: string;
  model: string;
  skills: Array<{ id: number; code: string; name: string }>;
  config: {
    temperature: number;
    max_tokens: number;
    thinking: ThinkingLevel;
    timeout: number;
    retry: {
      max_attempts: number;
      backoff: "exponential" | "linear";
    };
  };
  status: AgentStatus;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  prototype?: {
    id: number;
    code: string;
    name: string;
    version: string;
  };
}

// ============================================================
// Agent Prototypes List
// ============================================================
export const mockPrototypes: AgentPrototype[] = [
  {
    id: 1,
    code: "customer-service-pro",
    name: "客服助手 Pro",
    description: "高级客服Agent，支持多轮对话和工单创建",
    version: "1.2.0",
    model: "gpt-4o",
    prompts: {},
    status: "enabled",
    created_by: 1,
    created_at: "2026-05-10T10:00:00Z",
    updated_at: "2026-05-15T14:30:00Z",
  },
  {
    id: 2,
    code: "sales-assistant",
    name: "销售助手",
    description: "辅助销售团队进行客户跟进和报价生成",
    version: "1.0.0",
    model: "gpt-4o-mini",
    prompts: {},
    status: "enabled",
    created_by: 1,
    created_at: "2026-04-20T09:00:00Z",
    updated_at: "2026-05-12T11:00:00Z",
  },
  {
    id: 3,
    code: "data-analyst-new",
    name: "数据分析助手（新）",
    description: "新一代数据分析Agent，支持SQL生成和可视化建议",
    version: null,
    model: "gpt-4o",
    prompts: {},
    status: "draft",
    created_by: 1,
    created_at: "2026-05-14T16:00:00Z",
    updated_at: "2026-05-14T16:00:00Z",
  },
  {
    id: 4,
    code: "retired-bot",
    name: "旧版FAQ机器人",
    description: "已停用的FAQ机器人，请勿使用",
    version: "2.1.0",
    model: "gpt-3.5-turbo",
    prompts: {},
    status: "disabled",
    created_by: 1,
    created_at: "2025-12-01T08:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
];

// ============================================================
// Agent Prototype Detail
// ============================================================
export const mockPrototype = {
  id: 1,
  code: "customer-service-pro",
  name: "客服助手 Pro",
  description: "高级客服Agent，支持多轮对话和工单创建",
  version: "1.2.0",
  model: "gpt-4o",
  temperature: 0.7,
  max_tokens: 4096,
  status: "enabled" as AgentStatus,
  created_by: 1,
  created_at: "2026-05-10T10:00:00Z",
  updated_at: "2026-05-15T14:30:00Z",
};

export const promptTypes = [
  { key: "soul", label: "SOUL", preview: "你是一个专业的客服助手..." },
  { key: "memory", label: "MEMORY", preview: "## 记忆机制..." },
  { key: "reasoning", label: "REASONING", preview: "## 推理方式..." },
  { key: "agents", label: "AGENTS", preview: "## 多智能体协作..." },
  { key: "workflow", label: "WORKFLOW", preview: "## 工作流程..." },
  { key: "communication", label: "COMMUNICATION", preview: "## 沟通规范..." },
];

// ============================================================
// Agents List (in workspace)
// ============================================================
export const mockAgents: Agent[] = [
  {
    id: 1,
    code: "beijing-cs-agent",
    name: "客服助手-北京分部",
    description: "服务于北京地区的客户咨询和问题解答",
    prototype_id: 1,
    prototype_version: "1.2.0",
    workspace_id: 1,
    workspace_name: "北京分部",
    model: "gpt-4o",
    skills: [
      { id: 1, code: "faq", name: "FAQ 查询" },
      { id: 2, code: "ticket", name: "工单创建" },
    ],
    config: {
      temperature: 0.7,
      max_tokens: 4096,
      thinking: "medium",
      timeout: 60,
      retry: { max_attempts: 3, backoff: "exponential" },
    },
    status: "enabled",
    created_by: 1,
    created_by_name: "张三",
    created_at: "2026-05-10T10:00:00Z",
    updated_at: "2026-05-15T14:30:00Z",
    prototype: {
      id: 1,
      code: "customer-service-pro",
      name: "客服助手 Pro",
      version: "1.2.0",
    },
  },
];

// ============================================================
// Agent Detail (full - for detail page)
// ============================================================
export const mockAgentFull: Agent = {
  id: 1,
  code: "beijing-cs-agent",
  name: "客服助手-北京分部",
  description: "服务于北京地区的客户咨询和问题解答",
  prototype_id: 1,
  prototype_version: "1.2.0",
  workspace_id: 1,
  workspace_name: "北京分部",
  model: "gpt-4o",
  skills: [
    { id: 1, code: "faq", name: "FAQ 查询" },
    { id: 2, code: "ticket", name: "工单创建" },
  ],
  config: {
    temperature: 0.7,
    max_tokens: 4096,
    thinking: "medium",
    timeout: 60,
    retry: { max_attempts: 3, backoff: "exponential" },
  },
  status: "enabled",
  created_by: 1,
  created_by_name: "张三",
  created_at: "2026-05-10T10:00:00Z",
  updated_at: "2026-05-15T14:30:00Z",
  prototype: {
    id: 1,
    code: "customer-service-pro",
    name: "客服助手 Pro",
    version: "1.2.0",
  },
};

// ============================================================
// Agent Detail (edit page - selected skills only)
// ============================================================
export const mockAgentDetail = {
  id: 1,
  name: "客服助手-北京分部",
  description: "服务于北京地区的客户咨询和问题解答",
  prototype_id: 1,
  prototype_version: "1.2.0",
  model: "gpt-4o",
  skills: [
    { skill_id: 1, code: "faq", name: "FAQ 查询", selected_version: "2.1.0" },
    {
      skill_id: 2,
      code: "ticket",
      name: "工单创建",
      selected_version: "1.0.0",
    },
  ],
};
