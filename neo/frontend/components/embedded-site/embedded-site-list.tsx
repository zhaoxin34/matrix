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
import { listEmbeddedSites, getErrorMessage } from "@/lib/api/embedded-sites";

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
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);

	const pageSize = 20;

	const fetchSites = useCallback(
		async (searchQuery: string, status: string, pageNum: number) => {
			setLoading(true);
			try {
				const response = await listEmbeddedSites(workspaceCode, {
					page: pageNum,
					page_size: pageSize,
					status: status === "all" ? undefined : (status as EmbeddedSiteStatus),
					search: searchQuery || undefined,
				});
				setSites(response.list);
				setTotal(response.total);
				setTotalPages(response.total_pages);
				setPage(response.page);
			} catch (error) {
				const err = error as { code?: number };
				toast.error(getErrorMessage(err.code || 9001));
			} finally {
				setLoading(false);
			}
		},
		[workspaceCode],
	);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				const response = await listEmbeddedSites(workspaceCode, {
					page: 1,
					page_size: pageSize,
					status:
						statusFilter === "all"
							? undefined
							: (statusFilter as EmbeddedSiteStatus),
					search: search || undefined,
				});
				if (!cancelled) {
					setSites(response.list);
					setTotal(response.total);
					setTotalPages(response.total_pages);
					setPage(response.page);
				}
			} catch (error) {
				if (!cancelled) {
					const err = error as { code?: number };
					toast.error(getErrorMessage(err.code || 9001));
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [workspaceCode, search, statusFilter]);

	const handleSearch = useCallback(
		(query: string) => {
			setSearch(query);
			fetchSites(query, statusFilter, 1);
		},
		[fetchSites, statusFilter],
	);

	const handleStatusFilter = useCallback(
		(status: EmbeddedSiteStatus | "all") => {
			setStatusFilter(status);
			fetchSites(search, status, 1);
		},
		[fetchSites, search],
	);

	const handleSiteCreated = useCallback(
		(_newSite: EmbeddedSite) => {
			toast.success("嵌入网站创建成功");
			fetchSites(search, statusFilter, 1);
		},
		[fetchSites, search, statusFilter],
	);

	const handleStatusChange = useCallback((updatedSite: EmbeddedSite) => {
		setSites((prev) =>
			prev.map((s) => (s.id === updatedSite.id ? updatedSite : s)),
		);
	}, []);

	const handlePageChange = useCallback(
		(newPage: number) => {
			fetchSites(search, statusFilter, newPage);
		},
		[fetchSites, search, statusFilter],
	);

	const filteredSites = sites;

	return (
		<div className={`space-y-6 ${className ?? ""}`}>
			<EmbeddedSiteHeader
				onSearch={handleSearch}
				onStatusFilter={handleStatusFilter}
				currentStatus={statusFilter}
			/>

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
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<HugeiconsIcon
							icon={Folder02Icon}
							strokeWidth={1.5}
							className="size-12 text-muted-foreground/50 mb-4"
						/>
						<h3 className="text-sm font-medium mb-1">暂无嵌入网站</h3>
						<p className="text-sm text-muted-foreground mb-4">
							点击创建按钮添加第一个嵌入网站
						</p>
						<EmbeddedSiteFormDialog
							workspaceId={workspaceId}
							workspaceCode={workspaceCode}
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
				<>
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							共 {total} 个嵌入网站
						</p>
						<EmbeddedSiteFormDialog
							workspaceId={workspaceId}
							workspaceCode={workspaceCode}
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
								onStatusChange={handleStatusChange}
							/>
						))}
					</div>
					{totalPages > 1 && (
						<div className="flex justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(page - 1)}
								disabled={page <= 1}
							>
								上一页
							</Button>
							<span className="text-sm text-muted-foreground py-2">
								第 {page} / {totalPages} 页
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(page + 1)}
								disabled={page >= totalPages}
							>
								下一页
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
