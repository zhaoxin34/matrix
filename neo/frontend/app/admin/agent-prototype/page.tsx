"use client";

import { useState } from "react";
import { AgentPrototypeHeader } from "@/components/agent-prototype/agent-prototype-header";
import { AgentPrototypeCard } from "@/components/agent-prototype/agent-prototype-card";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder02Icon } from "@hugeicons/core-free-icons";
import type { AgentPrototypeStatus } from "@/components/agent-prototype/agent-prototype-types";
import { mockPrototypes } from "@/mockdata/admin/agent-prototype";

/**
 * Admin Agent Prototype List Page
 *
 * 路由: /admin/agent-prototype
 * 角色: 仅限 admin 角色访问
 * 功能: 展示所有 Agent Prototype 列表，支持搜索、筛选、新建
 */
export default function AdminAgentPrototypeListPage() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		AgentPrototypeStatus | "all"
	>("all");

	// Client-side filtering
	const filteredPrototypes = mockPrototypes.filter((pt) => {
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
				onSearch={setSearch}
				onStatusFilter={setStatusFilter}
				currentStatus={statusFilter}
			/>

			{filteredPrototypes.length === 0 ? (
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
						<AgentPrototypeCard
							key={prototype.id}
							prototype={prototype}
							onDataChange={() => {}}
						/>
					))}
				</div>
			)}
		</div>
	);
}
