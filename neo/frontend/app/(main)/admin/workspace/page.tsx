"use client";

import { useState, useEffect } from "react";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Folder02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { getWorkspaceList, type Workspace } from "@/lib/api/workspace";
import { useOrganizationStore } from "@/hooks/use-organization-store";

export default function AdminWorkspaceListPage() {
	const orgUnits = useOrganizationStore((s) => s.orgUnits);
	const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);
	const loadOrgUnits = useOrganizationStore((s) => s.loadOrgUnits);

	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [loading, setLoading] = useState(true);

	// 初始化加载 org 数据
	useEffect(() => {
		if (orgUnits.length === 0) {
			loadOrgUnits();
		}
	}, []);

	// 加载工作区数据
	useEffect(() => {
		if (orgUnits.length === 0) return;

		const fetchWorkspaces = async () => {
			setLoading(true);
			try {
				const result = await getWorkspaceList({
					org_id: selectedOrgId ?? undefined,
				});
				setWorkspaces(result.list);
			} catch (error) {
				console.error("Failed to fetch workspaces:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchWorkspaces();
	}, [selectedOrgId, orgUnits.length]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-heading font-medium">工作区管理</h1>
					<p className="text-xs text-muted-foreground mt-1">
						当前组织: {selectedOrgId || "未选择"}
					</p>
				</div>
				<Button asChild>
					<Link href="/admin/workspace/new">
						<HugeiconsIcon
							icon={Add01Icon}
							strokeWidth={1.5}
							className="size-4 mr-1"
						/>
						新建工作区
					</Link>
				</Button>
			</div>

			{loading && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardContent className="p-4">
								<Skeleton className="h-4 w-2/3 mb-2" />
								<Skeleton className="h-3 w-full mb-4" />
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{!loading && workspaces.length === 0 && (
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
			)}

			{!loading && workspaces.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{workspaces.map((workspace) => (
						<div key={workspace.id} className="relative group">
							<WorkspaceCard workspace={workspace} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}
