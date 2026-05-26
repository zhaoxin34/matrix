import type {
	SelectablePrototype,
	SkillWithVersions,
} from "@/components/agent-factory/agent-factory-types";
import type { Agent } from "@/components/agent-factory/agent-factory-types";

// ============================================================
// Models
// ============================================================
export const models = [
	{ value: "gpt-4o", label: "GPT-4o" },
	{ value: "gpt-4o-mini", label: "GPT-4o Mini" },
	{ value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
	{ value: "claude-3-haiku", label: "Claude 3 Haiku" },
] as const;

// ============================================================
// Prototypes
// ============================================================
export const mockPrototypes: SelectablePrototype[] = [
	{
		id: 1,
		code: "customer-service-pro",
		name: "客服助手 Pro",
		description: "高级客服Agent，支持多轮对话和工单创建",
		current_version: "1.2.0",
		versions: [
			{
				id: 11,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-01-01",
			},
			{
				id: 12,
				version: "1.1.0",
				change_summary: "支持工单创建",
				created_at: "2026-03-01",
			},
			{
				id: 13,
				version: "1.2.0",
				change_summary: "优化对话逻辑",
				created_at: "2026-05-01",
			},
		],
		model: "gpt-4o",
	},
	{
		id: 2,
		code: "sales-assistant",
		name: "销售助手",
		description: "辅助销售团队进行客户跟进和报价生成",
		current_version: "1.0.0",
		versions: [
			{
				id: 21,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-04-01",
			},
		],
		model: "gpt-4o-mini",
	},
	{
		id: 3,
		code: "data-analyst",
		name: "数据分析助手",
		description: "支持 SQL 生成和可视化建议",
		current_version: "2.0.0",
		versions: [
			{
				id: 31,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-02-01",
			},
			{
				id: 32,
				version: "2.0.0",
				change_summary: "新增可视化建议",
				created_at: "2026-05-15",
			},
		],
		model: "gpt-4o",
	},
];

// ============================================================
// Skills
// ============================================================
export const mockSkills: SkillWithVersions[] = [
	{
		id: 1,
		code: "faq",
		name: "FAQ 查询",
		current_version: "2.1.0",
		versions: [
			{
				id: 11,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-01-01",
			},
			{
				id: 12,
				version: "2.0.0",
				change_summary: "支持向量检索",
				created_at: "2026-03-15",
			},
			{
				id: 13,
				version: "2.1.0",
				change_summary: "优化匹配算法",
				created_at: "2026-05-20",
			},
		],
	},
	{
		id: 2,
		code: "ticket",
		name: "工单创建",
		current_version: "1.0.0",
		versions: [
			{
				id: 21,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-04-01",
			},
		],
	},
	{
		id: 3,
		code: "crm",
		name: "CRM 集成",
		current_version: "1.2.0",
		versions: [
			{
				id: 31,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-02-01",
			},
			{
				id: 32,
				version: "1.1.0",
				change_summary: "支持自定义字段",
				created_at: "2026-04-10",
			},
			{
				id: 33,
				version: "1.2.0",
				change_summary: "新增批量操作",
				created_at: "2026-05-25",
			},
		],
	},
	{
		id: 4,
		code: "knowledge",
		name: "知识库查询",
		current_version: "3.0.0",
		versions: [
			{
				id: 41,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-01-15",
			},
			{
				id: 42,
				version: "2.0.0",
				change_summary: "支持多语言",
				created_at: "2026-03-01",
			},
			{
				id: 43,
				version: "3.0.0",
				change_summary: "支持语义搜索",
				created_at: "2026-05-30",
			},
		],
	},
	{
		id: 5,
		code: "email",
		name: "邮件发送",
		current_version: "1.1.0",
		versions: [
			{
				id: 51,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-02-20",
			},
			{
				id: 52,
				version: "1.1.0",
				change_summary: "支持附件",
				created_at: "2026-04-15",
			},
		],
	},
	{
		id: 6,
		code: "calendar",
		name: "日历管理",
		current_version: "1.0.0",
		versions: [
			{
				id: 61,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-03-10",
			},
		],
	},
	{
		id: 7,
		code: "sms",
		name: "短信发送",
		current_version: "1.0.0",
		versions: [
			{
				id: 71,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-03-15",
			},
		],
	},
	{
		id: 8,
		code: "analytics",
		name: "数据分析",
		current_version: "2.0.0",
		versions: [
			{
				id: 81,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-02-01",
			},
			{
				id: 82,
				version: "2.0.0",
				change_summary: "支持可视化",
				created_at: "2026-04-20",
			},
		],
	},
	{
		id: 9,
		code: "translate",
		name: "翻译助手",
		current_version: "1.5.0",
		versions: [
			{
				id: 91,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-01-20",
			},
			{
				id: 92,
				version: "1.5.0",
				change_summary: "支持多语言",
				created_at: "2026-05-10",
			},
		],
	},
	{
		id: 10,
		code: "report",
		name: "报告生成",
		current_version: "1.0.0",
		versions: [
			{
				id: 101,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-04-01",
			},
		],
	},
];

// ============================================================
// Agents (Agent 实例列表)
// ============================================================
export const mockAgents: Agent[] = [
	{
		id: 1,
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
	{
		id: 2,
		name: "销售助手-华东区",
		description: "辅助华东地区销售团队进行客户跟进",
		prototype_id: 2,
		prototype_version: "1.0.0",
		workspace_id: 1,
		workspace_name: "华东区",
		model: "gpt-4o-mini",
		skills: [{ id: 3, code: "crm", name: "CRM 集成" }],
		config: {
			temperature: 0.5,
			max_tokens: 2048,
			thinking: "low",
			timeout: 30,
			retry: { max_attempts: 2, backoff: "linear" },
		},
		status: "enabled",
		created_by: 1,
		created_by_name: "李四",
		created_at: "2026-04-20T09:00:00Z",
		updated_at: "2026-05-12T11:00:00Z",
		prototype: {
			id: 2,
			code: "sales-assistant",
			name: "销售助手",
			version: "1.0.0",
		},
	},
	{
		id: 3,
		name: "数据分析助手-测试",
		description: "用于测试的数据分析 Agent",
		prototype_id: 3,
		prototype_version: "0.1.0",
		workspace_id: 1,
		workspace_name: "测试环境",
		model: "gpt-4o",
		skills: [],
		config: {
			temperature: 0.8,
			max_tokens: 8192,
			thinking: "high",
			timeout: 120,
			retry: { max_attempts: 5, backoff: "exponential" },
		},
		status: "disabled",
		created_by: 2,
		created_by_name: "王五",
		created_at: "2026-05-14T16:00:00Z",
		updated_at: "2026-05-14T16:00:00Z",
		prototype: {
			id: 3,
			code: "data-analyst-new",
			name: "数据分析助手（新）",
			version: "0.1.0",
		},
	},
];
