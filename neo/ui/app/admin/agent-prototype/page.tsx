"use client";

import { useState, useEffect } from "react";
import { AgentPrototypeHeader } from "@/components/agent-prototype/agent-prototype-header";
import { AgentPrototypeCard } from "@/components/agent-prototype/agent-prototype-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder02Icon } from "@hugeicons/core-free-icons";
import type {
	AgentPrototype,
	AgentPrototypeStatus,
} from "@/components/agent-prototype/agent-prototype-types";

/**
 * Admin Agent Prototype List Page
 *
 * 路由: /admin/agent-prototype
 * 角色: 仅限 admin 角色访问
 * 功能: 展示所有 Agent Prototype 列表，支持搜索、筛选、新建
 */
export default function AdminAgentPrototypeListPage() {
	const [prototypes, setPrototypes] = useState<AgentPrototype[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		AgentPrototypeStatus | "all"
	>("all");

	// Fetch prototypes when filters change
	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				if (search) params.set("search", search);
				if (statusFilter !== "all") params.set("status", statusFilter);

				const response = await fetch(`/api/v1/agent_prototype?${params}`);
				const result = await response.json();

				if (result.code === 0) {
					setPrototypes(result.data.list);
				}
			} catch (error) {
				console.error("Failed to fetch prototypes:", error);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [search, statusFilter]);

	const handleSearch = (query: string) => setSearch(query);
	const handleStatusFilter = (status: AgentPrototypeStatus | "all") =>
		setStatusFilter(status);

	// Mock data for demonstration
	const mockPrototypes: AgentPrototype[] = [
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

	// Use mock data if API returns empty
	const displayPrototypes = loading
		? []
		: prototypes.length > 0
			? prototypes
			: mockPrototypes;

	// Client-side filtering
	const filteredPrototypes = displayPrototypes.filter((pt) => {
		const matchesSearch =
			!search ||
			pt.name.toLowerCase().includes(search.toLowerCase()) ||
			pt.code.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter === "all" || pt.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-heading font-medium">Agent 原型管理</h1>
					<p className="text-xs text-muted-foreground mt-1">
						创建和管理 Agent 原型模板
					</p>
				</div>
			</div>

			<AgentPrototypeHeader
				onSearch={handleSearch}
				onStatusFilter={handleStatusFilter}
				currentStatus={statusFilter}
			/>

			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<Card key={i}>
							<CardContent className="p-4 space-y-3">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-3 w-full" />
								<Skeleton className="h-8 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			) : displayPrototypes.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<HugeiconsIcon
							icon={Folder02Icon}
							strokeWidth={1.5}
							className="size-12 text-muted-foreground/50 mb-4"
						/>
						<h3 className="text-sm font-medium mb-1">暂无 Agent 原型</h3>
						<p className="text-xs text-muted-foreground mb-4">
							点击新建按钮创建第一个 Agent 原型
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredPrototypes.map((prototype) => (
						<AgentPrototypeCard key={prototype.id} prototype={prototype} />
					))}
				</div>
			)}
		</div>
	);
}
