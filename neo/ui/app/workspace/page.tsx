"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { WorkspaceStatus } from "@/components/workspace/workspace-types";

interface WorkspaceListItem {
	id: number;
	name: string;
	code: string;
	description?: string;
	status: WorkspaceStatus;
	owner_id: number;
	created_at: string;
	member_count?: number;
	project_count?: number;
}

// Fetch function defined outside component to avoid lint issues
async function fetchWorkspaceList(
	search: string,
	statusFilter: string,
): Promise<WorkspaceListItem[]> {
	const params = new URLSearchParams();
	if (search) params.set("search", search);
	if (statusFilter !== "all") params.set("status", statusFilter);

	const response = await fetch(`/api/v1/workspaces/my?${params}`);
	const result = await response.json();

	if (result.code === 0) {
		return result.data.list;
	}
	return [];
}

/**
 * User Workspace List Page
 *
 * 路由: /workspace
 * 角色: 所有登录用户
 * 功能: 展示当前用户可访问的 Workspace 列表
 */
export default function UserWorkspaceListPage() {
	const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<WorkspaceStatus | "all">(
		"all",
	);

	// Load workspaces when search or filter changes
	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			try {
				const data = await fetchWorkspaceList(search, statusFilter);
				if (!cancelled) {
					setWorkspaces(data);
				}
			} catch (error) {
				console.error("Failed to fetch workspaces:", error);
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		load();

		return () => {
			cancelled = true;
		};
	}, [search, statusFilter]);

	const handleSearch = useCallback((query: string) => {
		setSearch(query);
	}, []);

	const handleStatusFilter = useCallback((status: WorkspaceStatus | "all") => {
		setStatusFilter(status);
	}, []);

	// Client-side filtering (additional filter on top of API results)
	const filteredWorkspaces = workspaces.filter((ws) => {
		const matchesSearch =
			!search ||
			ws.name.toLowerCase().includes(search.toLowerCase()) ||
			ws.description?.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter === "all" || ws.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-xl font-heading font-medium">我的工作区</h1>
				<p className="text-xs text-muted-foreground mt-1">您参与的所有工作区</p>
			</div>

			{/* Search and Filter */}
			<div className="flex items-center gap-4">
				<div className="flex-1 max-w-md">
					<input
						type="text"
						placeholder="搜索工作区..."
						value={search}
						onChange={(e) => handleSearch(e.target.value)}
						className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
					/>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant={statusFilter === "all" ? "default" : "outline"}
						size="sm"
						onClick={() => handleStatusFilter("all")}
					>
						全部
					</Button>
					<Button
						variant={statusFilter === "active" ? "default" : "outline"}
						size="sm"
						onClick={() => handleStatusFilter("active")}
					>
						活跃
					</Button>
					<Button
						variant={statusFilter === "disabled" ? "default" : "outline"}
						size="sm"
						onClick={() => handleStatusFilter("disabled")}
					>
						已禁用
					</Button>
				</div>
			</div>

			{/* Workspace List */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardContent className="p-4 space-y-3">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-12 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			) : filteredWorkspaces.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<HugeiconsIcon
							icon={Folder02Icon}
							strokeWidth={1.5}
							className="size-12 text-muted-foreground/50 mb-4"
						/>
						<h3 className="text-sm font-medium mb-1">暂无工作区</h3>
						<p className="text-xs text-muted-foreground">
							您还没有加入任何工作区
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredWorkspaces.map((workspace) => (
						<Card
							key={workspace.id}
							className="hover:shadow-md transition-shadow cursor-pointer"
						>
							<CardContent className="p-4">
								<Link href={`/workspace/${workspace.code}`}>
									<div className="space-y-2">
										<div className="flex items-start justify-between">
											<div>
												<h3 className="font-medium text-sm">
													{workspace.name}
												</h3>
												<p className="text-xs text-muted-foreground">
													{workspace.code}
												</p>
											</div>
											<span
												className={`text-xs px-2 py-0.5 rounded ${
													workspace.status === "active"
														? "bg-green-100 text-green-700"
														: "bg-gray-100 text-gray-600"
												}`}
											>
												{workspace.status === "active" ? "活跃" : "已禁用"}
											</span>
										</div>
										{workspace.description && (
											<p className="text-xs text-muted-foreground line-clamp-2">
												{workspace.description}
											</p>
										)}
										<div className="flex items-center gap-4 text-xs text-muted-foreground">
											<span>{workspace.member_count ?? 0} 成员</span>
											<span>{workspace.project_count ?? 0} 项目</span>
										</div>
									</div>
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
