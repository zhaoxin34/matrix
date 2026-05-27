"use client";

import { useState, useCallback } from "react";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Add01Icon,
	Folder02Icon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import type {
	Workspace,
	WorkspaceStatus,
} from "@/components/workspace/workspace-types";
import { mockWorkspaces } from "@/mockdata/admin/workspace";

/**
 * Admin Workspace List Page
 *
 * 路由: /admin/workspace
 * 角色: 仅限 admin 角色访问
 * 功能: 展示所有 Workspace 列表，支持创建和管理
 */
export default function AdminWorkspaceListPage() {
	const [workspaces] = useState<Workspace[]>(mockWorkspaces);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<WorkspaceStatus | "all">(
		"all",
	);

	const handleSearch = useCallback((query: string) => {
		setSearch(query);
	}, []);

	const handleStatusFilter = useCallback((status: WorkspaceStatus | "all") => {
		setStatusFilter(status);
	}, []);

	const displayWorkspaces = workspaces.length > 0 ? workspaces : mockWorkspaces;

	// Client-side filtering for immediate response
	const filteredWorkspaces = displayWorkspaces.filter((ws) => {
		const matchesSearch =
			!search ||
			ws.name.toLowerCase().includes(search.toLowerCase()) ||
			ws.description?.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter === "all" || ws.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className="space-y-6">
			{/* Admin Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-heading font-medium">工作区管理</h1>
					<p className="text-xs text-muted-foreground mt-1">
						管理系统中的所有工作区
					</p>
				</div>
			</div>

			<WorkspaceHeader
				onSearch={handleSearch}
				onStatusFilter={handleStatusFilter}
				currentStatus={statusFilter}
			/>

			{displayWorkspaces.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<HugeiconsIcon
							icon={Folder02Icon}
							strokeWidth={1.5}
							className="size-12 text-muted-foreground/50 mb-4"
						/>
						<h3 className="text-sm font-medium mb-1">暂无工作区</h3>
						<p className="text-xs text-muted-foreground mb-4">
							点击创建按钮添加第一个工作区
						</p>
						<Button asChild>
							<Link href="/admin/workspace/new">
								<HugeiconsIcon
									icon={Add01Icon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								创建工作区
							</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredWorkspaces.map((workspace) => (
						<div key={workspace.id} className="relative group">
							<WorkspaceCard workspace={workspace} />
							{/* Admin action overlay */}
							<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<Button variant="secondary" size="sm" asChild>
									<Link href={`/admin/workspace/${workspace.id}/settings`}>
										<HugeiconsIcon
											icon={Settings01Icon}
											strokeWidth={1.5}
											className="size-3 mr-1"
										/>
										设置
									</Link>
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
