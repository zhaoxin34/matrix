"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { getWorkspace, type Workspace } from "@/lib/api/workspace";
import { useOrganizationStore } from "@/hooks/use-organization-store";
import { WorkspaceStatusBadge } from "@/components/workspace/workspace-status-badge";

export default function WorkspaceDetailPage() {
	const params = useParams();
	const workspaceId = parseInt(params.workspaceId as string, 10);

	const [workspace, setWorkspace] = useState<Workspace | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const orgUnits = useOrganizationStore((s) => s.orgUnits);
	const loadOrgUnits = useOrganizationStore((s) => s.loadOrgUnits);

	// 初始化加载 org 数据
	useEffect(() => {
		if (orgUnits.length === 0) {
			loadOrgUnits();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // orgUnits 和 loadOrgUnits 来自 store，变化时不需要重新执行

	// 加载工作区详情
	useEffect(() => {
		if (!workspaceId || isNaN(workspaceId)) return;

		const fetchWorkspace = async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await getWorkspace(workspaceId);
				setWorkspace(data);
			} catch (err) {
				console.error("Failed to fetch workspace:", err);
				setError("加载工作区详情失败");
			} finally {
				setLoading(false);
			}
		};

		fetchWorkspace();
	}, [workspaceId]);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/admin/workspace">
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								strokeWidth={1.5}
								className="size-4 mr-1"
							/>
							返回
						</Link>
					</Button>
				</div>

				<div className="grid gap-6">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-1/3" />
						</CardHeader>
						<CardContent className="space-y-4">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-2/3" />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (error || !workspace) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/admin/workspace">
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								strokeWidth={1.5}
								className="size-4 mr-1"
							/>
							返回
						</Link>
					</Button>
				</div>

				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<p className="text-muted-foreground">{error || "工作区不存在"}</p>
						<Button asChild className="mt-4">
							<Link href="/admin/workspace">返回工作区列表</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/admin/workspace">
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								strokeWidth={1.5}
								className="size-4 mr-1"
							/>
							返回
						</Link>
					</Button>
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-heading font-medium">
							{workspace.name}
						</h1>
						<WorkspaceStatusBadge status={workspace.status} />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link href={`/admin/workspace/${workspace.id}/settings`}>
							<HugeiconsIcon
								icon={Settings01Icon}
								strokeWidth={1.5}
								className="size-4 mr-1"
							/>
							设置
						</Link>
					</Button>
				</div>
			</div>

			{/* Content Grid */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Basic Info */}
				<Card>
					<CardHeader>
						<CardTitle>基本信息</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">工作区代码</p>
								<p className="font-mono text-sm">{workspace.code}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">状态</p>
								<p className="text-sm capitalize">{workspace.status}</p>
							</div>
						</div>

						{workspace.description && (
							<div>
								<p className="text-sm text-muted-foreground">描述</p>
								<p className="text-sm">{workspace.description}</p>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4 pt-4 border-t">
							<div>
								<p className="text-sm text-muted-foreground">创建时间</p>
								<p className="text-sm">
									{new Date(workspace.created_at).toLocaleDateString("zh-CN")}
								</p>
							</div>
							{workspace.updated_at && (
								<div>
									<p className="text-sm text-muted-foreground">更新时间</p>
									<p className="text-sm">
										{new Date(workspace.updated_at).toLocaleDateString("zh-CN")}
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Statistics */}
				<Card>
					<CardHeader>
						<CardTitle>统计数据</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-6">
							<div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
								<p className="text-3xl font-bold">
									{workspace.member_count ?? 0}
								</p>
								<p className="text-sm text-muted-foreground">成员</p>
							</div>
							<div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
								<p className="text-3xl font-bold">
									{workspace.project_count ?? 0}
								</p>
								<p className="text-sm text-muted-foreground">项目</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>快捷操作</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						<Button variant="outline" size="sm" asChild>
							<Link href={`/admin/workspace/${workspace.id}/settings`}>
								<HugeiconsIcon
									icon={Settings01Icon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								工作区设置
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
