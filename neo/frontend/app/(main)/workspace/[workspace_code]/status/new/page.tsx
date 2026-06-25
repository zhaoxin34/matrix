"use client";

/**
 * Status Create Page
 *
 * 路由: /workspace/{workspace_code}/status/new
 * 功能: 创建新状态记录
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { StatusForm } from "@/components/status/status-form";
import type { EmbeddedSite } from "@/components/embedded-site";
import { listEmbeddedSites } from "@/lib/api/embedded-sites";

export default function StatusCreatePage() {
	const params = useParams();
	const workspace_code = params.workspace_code as string;

	const [sites, setSites] = useState<EmbeddedSite[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		listEmbeddedSites(workspace_code, { page: 1, page_size: 100 })
			.then((response) => {
				setSites(response.list);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, [workspace_code]);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-6 w-32" />
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
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
					<h1 className="text-xl font-heading font-medium">创建状态</h1>
					<p className="text-xs text-muted-foreground mt-1">
						手动创建一个新的状态记录
					</p>
				</div>
			</div>

			{/* Status Form */}
			<StatusForm workspaceCode={workspace_code} sites={sites} />
		</div>
	);
}
