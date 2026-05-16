"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Folder02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { EmbeddedSiteCard } from "./embedded-site-card";
import { EmbeddedSiteHeader } from "./embedded-site-header";
import { EmbeddedSiteFormDialog } from "./embedded-site-form";
import type { EmbeddedSite, EmbeddedSiteStatus } from "./embedded-site-types";

// Mock 数据
const mockSites: EmbeddedSite[] = [
	{
		id: 1,
		workspace_id: 1,
		site_name: "官方文档中心",
		site_url: "https://docs.example.com",
		description: "产品使用文档和API参考",
		status: "enabled",
		created_at: "2024-01-15T10:30:00Z",
		updated_at: "2024-01-15T10:30:00Z",
	},
	{
		id: 2,
		workspace_id: 1,
		site_name: "帮助中心",
		site_url: "https://help.example.com",
		description: "常见问题解答和使用指南",
		status: "enabled",
		created_at: "2024-01-10T08:00:00Z",
		updated_at: "2024-01-12T14:20:00Z",
	},
	{
		id: 3,
		workspace_id: 1,
		site_name: "技术博客",
		site_url: "https://blog.example.com",
		description: "最新技术文章和最佳实践",
		status: "disabled",
		created_at: "2024-01-05T09:15:00Z",
		updated_at: "2024-01-08T16:45:00Z",
	},
	{
		id: 4,
		workspace_id: 1,
		site_name: "社区论坛",
		site_url: "https://community.example.com",
		description: "用户交流和问题讨论区",
		status: "enabled",
		created_at: "2024-01-02T11:00:00Z",
		updated_at: "2024-01-02T11:00:00Z",
	},
];

interface EmbeddedSiteListProps {
	workspaceId: number;
	workspaceCode: string;
	className?: string;
}

export function EmbeddedSiteList({
	workspaceId,
	workspaceCode,
	className,
}: EmbeddedSiteListProps) {
	const [sites, setSites] = useState<EmbeddedSite[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<EmbeddedSiteStatus | "all">(
		"all",
	);

	// 数据获取函数 - 本地模拟数据，无需后端
	const fetchSites = useCallback(
		async (_searchQuery: string, _status: string): Promise<void> => {
			setLoading(true);
			// 模拟网络延迟
			await new Promise((resolve) => setTimeout(resolve, 300));
			// 使用 mock 数据
			setSites(mockSites);
			setLoading(false);
		},
		[],
	);

	// 初始化时获取数据
	useEffect(() => {
		const load = async () => {
			setLoading(true);
			await fetchSites(search, statusFilter);
			setLoading(false);
		};
		load();
	}, []);

	const handleSearch = useCallback(
		(query: string) => {
			setSearch(query);
			fetchSites(query, statusFilter);
		},
		[fetchSites, statusFilter],
	);

	const handleStatusFilter = useCallback(
		(status: EmbeddedSiteStatus | "all") => {
			setStatusFilter(status);
			fetchSites(search, status);
		},
		[fetchSites, search],
	);

	const handleSiteCreated = useCallback(
		(_newSite: EmbeddedSite) => {
			toast.success("嵌入网站创建成功");
			fetchSites(search, statusFilter);
		},
		[fetchSites, search, statusFilter],
	);

	// Client-side filtering for immediate response
	const filteredSites = sites.filter((site) => {
		const matchesSearch =
			!search ||
			site.site_name.toLowerCase().includes(search.toLowerCase()) ||
			site.site_url.toLowerCase().includes(search.toLowerCase()) ||
			site.description?.toLowerCase().includes(search.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || site.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className={`space-y-6 ${className ?? ""}`}>
			{/* Header with Search & Filter */}
			<EmbeddedSiteHeader
				onSearch={handleSearch}
				onStatusFilter={handleStatusFilter}
				currentStatus={statusFilter}
			/>

			{/* Loading State */}
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
			) : filteredSites.length === 0 ? (
				/* Empty State */
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<HugeiconsIcon
							icon={Folder02Icon}
							strokeWidth={1.5}
							className="size-12 text-muted-foreground/50 mb-4"
						/>
						<h3 className="text-sm font-medium mb-1">暂无嵌入网站</h3>
						<p className="text-xs text-muted-foreground mb-4">
							点击创建按钮添加第一个嵌入网站
						</p>
						<EmbeddedSiteFormDialog
							workspaceId={workspaceId}
							onSuccess={handleSiteCreated}
							trigger={
								<Button>
									<HugeiconsIcon
										icon={Add01Icon}
										strokeWidth={1.5}
										className="size-4 mr-1"
									/>
									创建嵌入网站
								</Button>
							}
						/>
					</CardContent>
				</Card>
			) : (
				/* Site List */
				<>
					<div className="flex items-center justify-between">
						<p className="text-xs text-muted-foreground">
							共 {filteredSites.length} 个嵌入网站
						</p>
						<EmbeddedSiteFormDialog
							workspaceId={workspaceId}
							onSuccess={handleSiteCreated}
							trigger={
								<Button size="sm">
									<HugeiconsIcon
										icon={Add01Icon}
										strokeWidth={1.5}
										className="size-4 mr-1"
									/>
									创建
								</Button>
							}
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredSites.map((site) => (
							<EmbeddedSiteCard
								key={site.id}
								site={site}
								workspaceCode={workspaceCode}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
