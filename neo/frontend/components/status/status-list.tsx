"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Folder02Icon,
	Add01Icon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Delete04Icon,
	ViewIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusHeader } from "./status-header";
import type { Status } from "./status-types";
import { listStatus, deleteStatus, getErrorMessage } from "@/lib/api/status";

interface StatusListProps {
	workspaceCode: string;
	className?: string;
}

export function StatusList({ workspaceCode, className }: StatusListProps) {
	const [statuses, setStatuses] = useState<Status[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [siteId, setSiteId] = useState<number | undefined>(undefined);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [total, setTotal] = useState(0);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [pageSize, setPageSize] = useState(20);

	const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

	const fetchStatuses = useCallback(
		async (searchQuery: string, pageNum: number) => {
			setLoading(true);
			try {
				const response = await listStatus(workspaceCode, {
					page: pageNum,
					page_size: pageSize,
					entity_name: searchQuery || undefined,
					embedded_site_id: siteId,
				});
				setStatuses(response.list);
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
		[workspaceCode, pageSize, siteId],
	);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				const response = await listStatus(workspaceCode, {
					page: 1,
					page_size: pageSize,
					entity_name: search || undefined,
					embedded_site_id: siteId,
				});
				if (!cancelled) {
					setStatuses(response.list);
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
	}, [workspaceCode, search, pageSize, siteId]);

	const handlePageSizeChange = useCallback(
		(newSize: number) => {
			setPageSize(newSize);
			setPage(1); // Reset to first page
			fetchStatuses(search, 1);
		},
		[fetchStatuses, search],
	);

	const handleSiteFilter = useCallback(
		(newSiteId: number | undefined) => {
			setSiteId(newSiteId);
			setPage(1);
			fetchStatuses(search, 1);
		},
		[fetchStatuses, search],
	);

	const handleSearch = useCallback(
		(query: string) => {
			setSearch(query);
			fetchStatuses(query, 1);
		},
		[fetchStatuses],
	);

	const handlePageChange = useCallback(
		(newPage: number) => {
			fetchStatuses(search, newPage);
		},
		[fetchStatuses, search],
	);

	const handleDelete = async () => {
		if (deleteId === null) return;
		setDeleting(true);
		try {
			await deleteStatus(workspaceCode, deleteId);
			toast.success("状态已删除");
			setDeleteId(null);
			fetchStatuses(search, page);
		} catch (error) {
			const err = error as { code?: number };
			toast.error(getErrorMessage(err.code || 9001));
		} finally {
			setDeleting(false);
		}
	};

	const formatTimestamp = (timestamp: string | null) => {
		if (!timestamp) return "-";
		const date = new Date(timestamp);
		return date.toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className={`space-y-4 ${className ?? ""}`}>
			{/* Header */}
			<div className="flex items-center justify-between gap-4">
				<StatusHeader
					onSearch={handleSearch}
					onSiteFilter={handleSiteFilter}
					currentSearch={search}
					currentSiteId={siteId}
					workspaceCode={workspaceCode}
				/>
				<Link href={`/workspace/${workspaceCode}/status/new`}>
					<Button size="sm">
						<HugeiconsIcon icon={Add01Icon} className="size-4 mr-1" />
						创建
					</Button>
				</Link>
			</div>

			{/* List */}
			{loading ? (
				<Card>
					<div className="flex items-center justify-center py-16">
						<div className="text-sm text-muted-foreground">加载中...</div>
					</div>
				</Card>
			) : statuses.length === 0 ? (
				<Card>
					<div className="flex flex-col items-center justify-center py-16">
						<HugeiconsIcon
							icon={Folder02Icon}
							strokeWidth={1.5}
							className="size-12 text-muted-foreground/50 mb-4"
						/>
						<h3 className="text-sm font-medium mb-1">暂无状态记录</h3>
						<p className="text-sm text-muted-foreground">
							{search
								? "没有找到匹配的状态记录"
								: "状态数据将从用户行为中自动生成"}
						</p>
					</div>
				</Card>
			) : (
				<>
					<Card>
						{/* Table Header */}
						<div className="flex items-center px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
							<div className="flex-1 min-w-0">实体名称</div>
							<div className="w-32 hidden md:block">来源</div>
							<div className="w-40 hidden lg:block">捕获时间</div>
							<div className="w-24 text-right">操作</div>
						</div>

						{/* Table Body */}
						<div className="divide-y">
							{statuses.map((status) => (
								<div
									key={status.id}
									className="flex items-center px-4 py-3 hover:bg-muted/30 transition-colors"
								>
									<div className="flex-1 min-w-0 pr-4">
										<Link
											href={`/workspace/${workspaceCode}/status/${status.id}/edit`}
											className="font-medium text-primary hover:underline truncate block"
										>
											{status.entity_name}
										</Link>
										{status.attributes &&
											Object.keys(status.attributes).length > 0 && (
												<p className="text-xs text-muted-foreground truncate mt-0.5">
													{JSON.stringify(status.attributes).slice(0, 50)}
													{JSON.stringify(status.attributes).length > 50
														? "..."
														: ""}
												</p>
											)}
									</div>
									<div className="w-32 hidden md:block text-sm text-muted-foreground truncate">
										{status.source || "-"}
									</div>
									<div className="w-40 hidden lg:block text-xs text-muted-foreground">
										{formatTimestamp(status.captured_at)}
									</div>
									<div className="w-24 flex items-center justify-end gap-1">
										<Link
											href={`/workspace/${workspaceCode}/status/${status.id}/edit`}
										>
											<Button variant="ghost" size="sm" className="size-8 p-0">
												<HugeiconsIcon icon={ViewIcon} className="size-4" />
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="sm"
											className="size-8 p-0 text-destructive hover:text-destructive"
											onClick={() => setDeleteId(status.id)}
										>
											<HugeiconsIcon icon={Delete04Icon} className="size-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					</Card>

					{/* Pagination */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<p className="text-sm text-muted-foreground">共 {total} 条记录</p>
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">每页</span>
								<Select
									value={String(pageSize)}
									onValueChange={(v) => handlePageSizeChange(Number(v))}
								>
									<SelectTrigger className="w-[80px] h-8">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{PAGE_SIZE_OPTIONS.map((size) => (
											<SelectItem key={size} value={String(size)}>
												{size}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<span className="text-sm text-muted-foreground">条</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(page - 1)}
								disabled={page <= 1}
							>
								<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 mr-1" />
								上一页
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(page + 1)}
								disabled={page >= totalPages}
							>
								下一页
								<HugeiconsIcon
									icon={ArrowRight01Icon}
									className="size-4 ml-1"
								/>
							</Button>
						</div>
					</div>
				</>
			)}

			{/* Delete Confirmation */}
			<AlertDialog
				open={deleteId !== null}
				onOpenChange={() => setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确认删除</AlertDialogTitle>
						<AlertDialogDescription>
							此操作无法撤销，这将永久删除该状态记录。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleting ? "删除中..." : "删除"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
