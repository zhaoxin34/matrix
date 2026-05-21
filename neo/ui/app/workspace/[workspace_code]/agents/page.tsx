"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { AgentFactoryHeader } from "@/components/agent-factory/agent-factory-header";
import { AgentFactoryCard } from "@/components/agent-factory/agent-factory-card";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder02Icon } from "@hugeicons/core-free-icons";
import type {
	Agent,
	AgentStatus,
} from "@/components/agent-factory/agent-factory-types";

/**
 * Agent Factory List Page
 *
 * 路由: /workspace/{workspace_code}/agents
 * 角色: Workspace 成员
 * 功能: 展示当前 Workspace 下所有 Agent，支持搜索、筛选、新建
 */
export default function AgentFactoryListPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");

	// Mock data - 直接使用，不调用 API
	const mockAgents: Agent[] = [
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

	// Client-side filtering
	const filteredAgents = mockAgents.filter((agent) => {
		const matchesSearch =
			!search ||
			agent.name.toLowerCase().includes(search.toLowerCase()) ||
			agent.description?.toLowerCase().includes(search.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || agent.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-heading font-medium">Agent 列表</h1>
					<p className="text-xs text-muted-foreground mt-1">
						管理当前 Workspace 下的所有 Agent 实例
					</p>
				</div>
			</div>

			<AgentFactoryHeader
				onSearch={setSearch}
				onStatusFilter={setStatusFilter}
				currentStatus={statusFilter}
				createUrl={`/workspace/${workspaceCode}/agents/create`}
			/>

			{filteredAgents.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<HugeiconsIcon
							icon={Folder02Icon}
							strokeWidth={1.5}
							className="size-12 text-muted-foreground/50 mb-4"
						/>
						<h3 className="text-sm font-medium mb-1">暂无 Agent</h3>
						<p className="text-xs text-muted-foreground mb-4">
							点击新建按钮创建第一个 Agent
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredAgents.map((agent) => (
						<AgentFactoryCard
							key={agent.id}
							agent={agent}
							workspaceCode={workspaceCode}
							onDataChange={() => {}}
						/>
					))}
				</div>
			)}
		</div>
	);
}
