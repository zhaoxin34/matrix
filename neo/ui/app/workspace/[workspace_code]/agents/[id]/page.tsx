"use client";

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
	Settings02Icon,
	Calendar03Icon,
	Clock01Icon,
	UserGroupIcon,
	LinkCircle02Icon,
	CodeIcon,
	BrainIcon,
	StopWatchIcon,
	Refresh01Icon,
	FlashIcon,
} from "@hugeicons/core-free-icons";
import type { ThinkingLevel } from "@/components/agent-factory/agent-factory-types";
import { mockAgentFull } from "@/mockdata/admin/agent-prototype";

const statusConfig = {
	enabled: { label: "启用", variant: "default" as const },
	disabled: { label: "禁用", variant: "outline" as const },
	deleted: { label: "已删除", variant: "destructive" as const },
};

const thinkingConfig: Record<ThinkingLevel, { label: string; desc: string }> = {
	low: { label: "低", desc: "快速响应，简单任务" },
	medium: { label: "中", desc: "平衡速度与质量" },
	high: { label: "高", desc: "深度思考，复杂推理" },
};

/**
 * Agent Factory Detail Page
 *
 * 路由: /workspace/{workspace_code}/agents/{id}
 * 角色: Workspace 成员
 * 功能: 查看 Agent 详情
 */
export default function AgentFactoryDetailPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const agentId = params.id as string;

	// Use mock data from centralized mockdata
	const agent = mockAgentFull;

	const statusInfo = statusConfig[agent.status];
	const thinkingInfo = thinkingConfig[agent.config.thinking];

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
					<Link href={`/workspace/${workspaceCode}/agents`}>
						<HugeiconsIcon
							icon={ArrowLeft01Icon}
							strokeWidth={1.5}
							className="size-4"
						/>
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-heading font-medium">{agent.name}</h1>
						<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
					</div>
					<p className="text-sm text-muted-foreground mt-1">ID: {agent.id}</p>
				</div>
			</div>

			{/* Basic Info Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">基本信息</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-4 gap-4 text-sm">
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={LinkCircle02Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">基于</span>
							<span className="font-medium">
								{agent.prototype?.name ?? "-"} v{agent.prototype_version}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">模型</span>
							<span className="font-mono">{agent.model}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">创建人</span>
							<span>{agent.created_by_name ?? "-"}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">技能数</span>
							<span>{agent.skills?.length ?? 0}</span>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Calendar03Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">创建时间</span>
							<span>{formatDate(agent.created_at)}</span>
						</div>
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Clock01Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">更新时间</span>
							<span>{formatDate(agent.updated_at)}</span>
						</div>
					</div>

					{agent.description && (
						<div className="pt-4 border-t">
							<p className="text-sm text-muted-foreground mb-1">描述</p>
							<p className="text-sm">{agent.description}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Config Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<HugeiconsIcon
							icon={Settings02Icon}
							strokeWidth={1.5}
							className="size-4"
						/>
						运行配置
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{/* Temperature */}
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<HugeiconsIcon
									icon={FlashIcon}
									strokeWidth={1.5}
									className="size-4"
								/>
								<span className="text-sm">温度</span>
							</div>
							<p className="font-mono text-lg font-medium">
								{agent.config.temperature}
							</p>
							<p className="text-sm text-muted-foreground">0=确定, 1=随机</p>
						</div>

						{/* Max Tokens */}
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<HugeiconsIcon
									icon={CodeIcon}
									strokeWidth={1.5}
									className="size-4"
								/>
								<span className="text-sm">最大 Tokens</span>
							</div>
							<p className="font-mono text-lg font-medium">
								{agent.config.max_tokens}
							</p>
							<p className="text-sm text-muted-foreground">单次响应上限</p>
						</div>

						{/* Thinking Level */}
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<HugeiconsIcon
									icon={BrainIcon}
									strokeWidth={1.5}
									className="size-4"
								/>
								<span className="text-sm">思考深度</span>
							</div>
							<p className="font-mono text-lg font-medium">
								{thinkingInfo.label}
							</p>
							<p className="text-sm text-muted-foreground">
								{thinkingInfo.desc}
							</p>
						</div>

						{/* Timeout */}
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-muted-foreground">
								<HugeiconsIcon
									icon={StopWatchIcon}
									strokeWidth={1.5}
									className="size-4"
								/>
								<span className="text-sm">超时时间</span>
							</div>
							<p className="font-mono text-lg font-medium">
								{agent.config.timeout}s
							</p>
							<p className="text-sm text-muted-foreground">单次执行</p>
						</div>
					</div>

					{/* Retry Config */}
					<div className="mt-6 pt-4 border-t">
						<div className="flex items-center gap-2 text-muted-foreground mb-3">
							<HugeiconsIcon
								icon={Refresh01Icon}
								strokeWidth={1.5}
								className="size-4"
							/>
							<span className="text-sm">重试策略</span>
						</div>
						<div className="flex items-center gap-6 text-sm">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">最大重试</span>
								<span className="font-mono">
									{agent.config.retry.max_attempts} 次
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">退避策略</span>
								<span className="font-mono">
									{agent.config.retry.backoff === "exponential"
										? "指数退避"
										: "线性退避"}
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Skills Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<HugeiconsIcon
							icon={UserGroupIcon}
							strokeWidth={1.5}
							className="size-4"
						/>
						启用的技能 ({agent.skills?.length ?? 0})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{agent.skills && agent.skills.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{agent.skills.map((skill) => (
								<Badge key={skill.id} variant="outline">
									{skill.name}
								</Badge>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">暂无启用技能</p>
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
						<Button variant="outline" asChild>
							<Link href={`/workspace/${workspaceCode}/agents/${agentId}/edit`}>
								<HugeiconsIcon
									icon={Edit02Icon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								编辑
							</Link>
						</Button>

						{agent.status === "enabled" && (
							<Button variant="outline">
								<HugeiconsIcon
									icon={PauseIcon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								禁用
							</Button>
						)}

						{agent.status === "disabled" && (
							<>
								<Button>
									<HugeiconsIcon
										icon={PlayIcon}
										strokeWidth={1.5}
										className="size-4 mr-1"
									/>
									启用
								</Button>
								<Button variant="destructive" className="ml-auto">
									删除
								</Button>
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
