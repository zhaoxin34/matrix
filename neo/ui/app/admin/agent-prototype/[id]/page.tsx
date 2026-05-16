"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowLeft01Icon,
	Edit02Icon,
	PlayIcon,
	PauseIcon,
	Tag01Icon,
	Calendar03Icon,
	Clock01Icon,
} from "@hugeicons/core-free-icons";
import { VersionsDialog } from "@/components/agent-prototype/versions-dialog";
import { PublishDialog } from "@/components/agent-prototype/publish-dialog";
import type { AgentPrototype } from "@/components/agent-prototype/agent-prototype-types";

const statusConfig = {
	draft: { label: "草稿", variant: "secondary" as const },
	enabled: { label: "已启用", variant: "default" as const },
	disabled: { label: "已禁用", variant: "outline" as const },
};

export default function AgentPrototypeDetailPage() {
	const params = useParams();
	const prototypeId = params.id as string;

	const [versionsOpen, setVersionsOpen] = useState(false);
	const [publishOpen, setPublishOpen] = useState(false);

	// Mock data - 直接使用，不调用 API
	const mockPrototype: AgentPrototype = {
		id: 1,
		code: "customer-service-pro",
		name: "客服助手 Pro",
		description: "高级客服Agent，支持多轮对话和工单创建",
		version: "1.2.0",
		model: "gpt-4o",
		prompts: {
			system: "你是一个专业的客服助手...",
			user: "用户问题处理流程...",
			tool: "工具使用说明...",
		},
		status: "enabled",
		created_by: 1,
		created_at: "2026-05-10T10:00:00Z",
		updated_at: "2026-05-15T14:30:00Z",
	};

	const displayPrototype = mockPrototype;
	const statusInfo = statusConfig[displayPrototype.status];

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/admin/agent-prototype">
						<HugeiconsIcon
							icon={ArrowLeft01Icon}
							strokeWidth={1.5}
							className="size-4"
						/>
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-heading font-medium">
							{displayPrototype.name}
						</h1>
						<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						ID: {displayPrototype.id} · {displayPrototype.code}
					</p>
				</div>
			</div>

			{/* Basic Info Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">基本信息</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Tag01Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">版本</span>
							<span className="font-mono font-medium">
								{displayPrototype.version ?? "-"}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Tag01Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">模型</span>
							<span className="font-mono">{displayPrototype.model}</span>
						</div>
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Calendar03Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">创建时间</span>
							<span>{formatDate(displayPrototype.created_at)}</span>
						</div>
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Clock01Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">更新时间</span>
							<span>{formatDate(displayPrototype.updated_at)}</span>
						</div>
					</div>

					{displayPrototype.description && (
						<div className="pt-4 border-t">
							<p className="text-sm text-muted-foreground mb-1">描述</p>
							<p className="text-sm">{displayPrototype.description}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Actions Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">操作</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						<Button variant="outline" onClick={() => setVersionsOpen(true)}>
							<HugeiconsIcon
								icon={Clock01Icon}
								strokeWidth={1.5}
								className="size-4 mr-1"
							/>
							版本历史
						</Button>

						<Button variant="outline" asChild>
							<Link href={`/admin/agent-prototype/${prototypeId}/edit`}>
								<HugeiconsIcon
									icon={Edit02Icon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								编辑
							</Link>
						</Button>

						{displayPrototype.status === "draft" && (
							<Button onClick={() => setPublishOpen(true)}>
								<HugeiconsIcon
									icon={PlayIcon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								发布
							</Button>
						)}

						{displayPrototype.status === "enabled" && (
							<>
								<Button variant="outline">
									<HugeiconsIcon
										icon={PauseIcon}
										strokeWidth={1.5}
										className="size-4 mr-1"
									/>
									禁用
								</Button>
								<Button onClick={() => setPublishOpen(true)}>
									<HugeiconsIcon
										icon={PlayIcon}
										strokeWidth={1.5}
										className="size-4 mr-1"
									/>
									发布新版本
								</Button>
							</>
						)}

						{displayPrototype.status === "disabled" && (
							<Button>
								<HugeiconsIcon
									icon={PlayIcon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								启用
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Prompts Preview Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">提示词配置</CardTitle>
				</CardHeader>
				<CardContent>
					{Object.keys(displayPrototype.prompts).length > 0 ? (
						<div className="space-y-3">
							{Object.entries(displayPrototype.prompts).map(([key, value]) => (
								<div key={key} className="space-y-1">
									<p className="text-xs font-medium text-muted-foreground uppercase">
										{key}
									</p>
									<pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
										{value || "(空)"}
									</pre>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">暂无提示词配置</p>
					)}
				</CardContent>
			</Card>

			{/* Version History Dialog */}
			<VersionsDialog
				open={versionsOpen}
				onOpenChange={setVersionsOpen}
				prototypeId={prototypeId}
				onRollback={() => {}}
			/>

			{/* Publish Dialog */}
			<PublishDialog
				open={publishOpen}
				onOpenChange={setPublishOpen}
				prototypeId={prototypeId}
				currentVersion={displayPrototype.version ?? null}
				onSuccess={() => setPublishOpen(false)}
			/>
		</div>
	);
}
