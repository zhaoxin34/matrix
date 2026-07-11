/**
 * Status Detail Page
 *
 * 路由: /workspace/{workspace_code}/status/{id}
 * 功能: 查看状态记录详情
 */

import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStatus } from "@/lib/api/status";
import { CalendarIcon, TagIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface StatusDetailPageProps {
	params: Promise<{
		workspace_code: string;
		id: string;
	}>;
}

export default async function StatusDetailPage({
	params,
}: StatusDetailPageProps) {
	const { workspace_code, id } = await params;
	const statusId = parseInt(id, 10);

	if (isNaN(statusId)) {
		notFound();
	}

	let status;
	try {
		status = await getStatus(workspace_code, statusId);
	} catch {
		notFound();
	}

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	const attributeKeys = Object.keys(status.attributes);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href={`/workspace/${workspace_code}/status`}>
						<Button variant="ghost" size="sm">
							<ArrowLeft className="size-4 mr-2" />
							返回列表
						</Button>
					</Link>
					<div>
						<h1 className="text-xl font-heading font-medium">状态详情</h1>
						<p className="text-xs text-muted-foreground mt-1">
							查看状态记录详细信息
						</p>
					</div>
				</div>
			</div>

			{/* Status Details */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<span className="font-mono text-lg">
							{status.entity_type}:{status.entity_id}
						</span>
						<Badge variant="outline">ID: {status.id}</Badge>
						{status.source && (
							<Badge variant="secondary">{status.source}</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Basic Info */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<span className="text-xs text-muted-foreground">实体类型</span>
							<p className="font-mono text-sm">{status.entity_type}</p>
						</div>
						<div className="space-y-1">
							<span className="text-xs text-muted-foreground">实体 ID</span>
							<p className="font-mono text-sm">{status.entity_id}</p>
						</div>
						<div className="space-y-1">
							<span className="text-xs text-muted-foreground">统计时间</span>
							<p className="text-sm flex items-center gap-2">
								<CalendarIcon className="size-4 text-muted-foreground" />
								{formatDate(status.stat_at)}
							</p>
						</div>
						{status.session_id && (
							<div className="space-y-1">
								<span className="text-xs text-muted-foreground">会话 ID</span>
								<p className="font-mono text-sm">{status.session_id}</p>
							</div>
						)}
					</div>

					{/* Attributes */}
					<Separator />
					<div className="space-y-2">
						<span className="text-xs text-muted-foreground flex items-center gap-1">
							<TagIcon className="size-3" />
							属性 ({attributeKeys.length} 个)
						</span>
						<Textarea
							value={JSON.stringify(status.attributes, null, 2)}
							readOnly
							className="text-xs font-mono h-60 resize-none"
						/>
					</div>

					<Separator />

					{/* Timestamps */}
					<div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
						<div>
							<span>创建时间: {formatDate(status.created_at)}</span>
						</div>
						<div>
							<span>更新时间: {formatDate(status.updated_at)}</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
