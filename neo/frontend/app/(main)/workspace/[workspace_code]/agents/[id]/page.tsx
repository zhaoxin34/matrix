"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
	getAgent,
	enableAgent,
	disableAgent,
	deleteAgent,
	type AgentResponse,
} from "@/lib/api/agent";

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

function getConfigValue<T>(
	config: Record<string, unknown> | undefined,
	key: string,
	defaultValue: T,
): T {
	if (!config) return defaultValue;
	return (config[key] as T) ?? defaultValue;
}

/**
 * Agent Factory Detail Page
 */
export default function AgentFactoryDetailPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;
	const agentId = parseInt(params.id as string, 10);

	const [agent, setAgent] = useState<AgentResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	// Fetch agent details
	const fetchAgent = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await getAgent(workspaceCode, agentId);
			setAgent(data);
		} catch (err) {
			console.error("Failed to fetch agent:", err);
			setError(err instanceof Error ? err.message : "获取 Agent 详情失败");
		} finally {
			setLoading(false);
		}
	}, [workspaceCode, agentId]);

	// Initial fetch
	useEffect(() => {
		fetchAgent();
	}, [fetchAgent]);

	// Enable agent
	const handleEnable = async () => {
		try {
			setActionLoading("enable");
			await enableAgent(workspaceCode, agentId);
			await fetchAgent();
		} catch (err) {
			console.error("Failed to enable agent:", err);
			setError(err instanceof Error ? err.message : "启用 Agent 失败");
		} finally {
			setActionLoading(null);
		}
	};

	// Disable agent
	const handleDisable = async () => {
		try {
			setActionLoading("disable");
			await disableAgent(workspaceCode, agentId);
			await fetchAgent();
		} catch (err) {
			console.error("Failed to disable agent:", err);
			setError(err instanceof Error ? err.message : "禁用 Agent 失败");
		} finally {
			setActionLoading(null);
		}
	};

	// Delete agent
	const handleDelete = async () => {
		try {
			setActionLoading("delete");
			await deleteAgent(workspaceCode, agentId);
			router.push(`/workspace/${workspaceCode}/agents`);
		} catch (err) {
			console.error("Failed to delete agent:", err);
			setError(err instanceof Error ? err.message : "删除 Agent 失败");
		} finally {
			setActionLoading(null);
		}
	};

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

	if (loading && !agent) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
			</div>
		);
	}

	if (error && !agent) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<p className="text-sm text-destructive mb-2">{error}</p>
				<Button onClick={() => window.location.reload()}>点击重试</Button>
			</div>
		);
	}

	if (!agent) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<p className="text-sm text-muted-foreground">Agent 不存在</p>
				<Button variant="link" asChild className="mt-2">
					<Link href={`/workspace/${workspaceCode}/agents`}>返回列表</Link>
				</Button>
			</div>
		);
	}

	const statusInfo =
		statusConfig[agent.status as keyof typeof statusConfig] ||
		statusConfig.disabled;
	const thinkingLevel = getConfigValue(
		agent.config,
		"thinking",
		"medium",
	) as ThinkingLevel;
	const thinkingInfo = thinkingConfig[thinkingLevel] || thinkingConfig.medium;

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
								Prototype #{agent.prototype_id} v{agent.prototype_version}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">模型</span>
							<span className="font-mono">{agent.model}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">创建人</span>
							<span>ID: {agent.created_by}</span>
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
								{getConfigValue(agent.config, "temperature", 0.7)}
							</p>
							<p className="text-sm text-muted-foreground">0=确定, 1=随机</p>
						</div>

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
								{getConfigValue(agent.config, "max_tokens", 4096)}
							</p>
							<p className="text-sm text-muted-foreground">单次响应上限</p>
						</div>

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
								{getConfigValue(agent.config, "timeout", 60)}s
							</p>
							<p className="text-sm text-muted-foreground">单次执行</p>
						</div>
					</div>

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
									{getConfigValue(agent.config, "max_attempts", 3)} 次
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">退避策略</span>
								<span className="font-mono">
									{getConfigValue(agent.config, "backoff", "exponential") ===
									"exponential"
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
								<Badge key={skill.skill_id} variant="outline">
									skill #{skill.skill_id} · v{skill.version}
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
							<Button
								variant="outline"
								onClick={handleDisable}
								disabled={actionLoading === "disable"}
							>
								<HugeiconsIcon
									icon={PauseIcon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								{actionLoading === "disable" ? "禁用中..." : "禁用"}
							</Button>
						)}

						{agent.status === "disabled" && (
							<Button
								onClick={handleEnable}
								disabled={actionLoading === "enable"}
							>
								<HugeiconsIcon
									icon={PlayIcon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								{actionLoading === "enable" ? "启用中..." : "启用"}
							</Button>
						)}

						{agent.status !== "deleted" && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="destructive" className="ml-auto">
										删除
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>确认删除</AlertDialogTitle>
										<AlertDialogDescription>
											确定要删除 Agent &ldquo;{agent.name}&rdquo;
											吗？此操作无法撤销。
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>取消</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											disabled={actionLoading === "delete"}
										>
											{actionLoading === "delete" ? "删除中..." : "确认删除"}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
