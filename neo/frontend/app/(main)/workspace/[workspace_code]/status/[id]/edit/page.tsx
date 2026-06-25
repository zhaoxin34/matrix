"use client";

/**
 * Status Edit Page
 *
 * 路由: /workspace/{workspace_code}/status/{id}/edit
 * 功能: 编辑状态记录
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { StatusForm } from "@/components/status/status-form";
import { getStatus } from "@/lib/api/status";
import { listEmbeddedSites } from "@/lib/api/embedded-sites";
import type { Status } from "@/components/status";
import type { EmbeddedSite } from "@/components/embedded-site";

export default function StatusEditPage() {
	const params = useParams();
	const router = useRouter();
	const workspace_code = params.workspace_code as string;
	const id = params.id as string;
	const statusId = parseInt(id, 10);

	const [status, setStatus] = useState<Status | null>(null);
	const [sites, setSites] = useState<EmbeddedSite[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (isNaN(statusId)) {
			toast.error("无效的状态 ID");
			router.push(`/workspace/${workspace_code}/status`);
			return;
		}

		Promise.all([
			getStatus(workspace_code, statusId),
			listEmbeddedSites(workspace_code, { page: 1, page_size: 100 }),
		])
			.then(([statusData, sitesData]) => {
				setStatus(statusData);
				setSites(sitesData.list);
				setLoading(false);
			})
			.catch((error) => {
				console.error("Failed to fetch data:", error);
				toast.error("加载数据失败");
				setLoading(false);
				setTimeout(() => {
					router.push(`/workspace/${workspace_code}/status`);
				}, 2000);
			});
	}, [workspace_code, statusId, router]);

	const handleSuccess = () => {
		router.push(`/workspace/${workspace_code}/status`);
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-6 w-32" />
				</div>
				<Card>
					<CardContent className="p-6 space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-32 w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!status) {
		return null;
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center gap-4">
				<Link href={`/workspace/${workspace_code}/status`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="size-4 mr-2" />
						返回列表
					</Button>
				</Link>
				<div>
					<h1 className="text-xl font-heading font-medium">编辑状态</h1>
					<p className="text-xs text-muted-foreground mt-1">修改状态记录信息</p>
				</div>
			</div>

			{/* Status Form */}
			<StatusForm
				workspaceCode={workspace_code}
				status={status}
				sites={sites}
				onSuccess={handleSuccess}
			/>
		</div>
	);
}
