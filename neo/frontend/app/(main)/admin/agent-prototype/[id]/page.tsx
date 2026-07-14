"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import {
	getAgentPrototype,
	updateAgentPrototypeStatus,
	ApiError,
} from "@/lib/api/agent-prototype";
import type { AgentPrototypeResponse } from "@/lib/api/agent-prototype";
import { toast } from "sonner";

const statusConfig = {
	draft: { label: "草稿", variant: "secondary" as const },
	enabled: { label: "已启用", variant: "default" as const },
	disabled: { label: "已禁用", variant: "outline" as const },
};

export default function AgentPrototypeDetailPage() {
	const params = useParams();
	const prototypeId = params.id as string;

	const [prototype, setPrototype] = useState<AgentPrototypeResponse | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	const [versionsOpen, setVersionsOpen] = useState(false);
	const [publishOpen, setPublishOpen] = useState(false);

	const fetchPrototype = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await getAgentPrototype(parseInt(prototypeId, 10));
			setPrototype(data);
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
			} else {
				setError("获取数据失败");
			}
			console.error("Failed to fetch prototype:", err);
		} finally {
			setLoading(false);
		}
	}, [prototypeId]);

	useEffect(() => {
		requestAnimationFrame(() => {
			fetchPrototype();
		});
	}, [fetchPrototype]);

	const handleEnable = async () => {
		if (!prototype) return;
		setActionLoading(true);
		try {
			const updated = await updateAgentPrototypeStatus(prototype.id, {
				status: "enabled",
			});
			setPrototype(updated);
			toast.success("已启用");
		} catch (err) {
			if (err instanceof ApiError) {
				toast.error(err.message);
			} else {
				toast.error("操作失败");
			}
		} finally {
			setActionLoading(false);
		}
	};

	const handleDisable = async () => {
		if (!prototype) return;
		setActionLoading(true);
		try {
			const updated = await updateAgentPrototypeStatus(prototype.id, {
				status: "disabled",
			});
			setPrototype(updated);
			toast.success("已禁用");
		} catch (err) {
			if (err instanceof ApiError) {
				toast.error(err.message);
			} else {
				toast.error("操作失败");
			}
		} finally {
			setActionLoading(false);
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

	// Get prompts from prototype config
	const prompts = prototype?.prompts || {};
	const llmConfig: Record<string, unknown> = prototype?.llm_config || {};
	const temperature =
		typeof llmConfig.temperature === "number" ? llmConfig.temperature : 0.7;
	const maxTokens =
		typeof llmConfig.max_tokens === "number" ? llmConfig.max_tokens : 4096;

	const promptTypes = [
		{ key: "soul", label: "SOUL" },
		{ key: "memory", label: "MEMORY" },
		{ key: "reasoning", label: "REASONING" },
		{ key: "agents", label: "AGENTS" },
		{ key: "workflow", label: "WORKFLOW" },
		{ key: "communication", label: "COMMUNICATION" },
	];

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-9 w-9" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<Card>
					<CardContent className="py-8">
						<div className="flex flex-col items-center justify-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
							<p className="text-sm text-muted-foreground">加载中...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !prototype) {
		return (
			<div className="space-y-6">
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
					<div>
						<h1 className="text-xl font-heading font-medium">获取失败</h1>
					</div>
				</div>
				<Card className="border-red-200 bg-red-50">
					<CardContent className="py-4">
						<p className="text-sm text-red-600">{error || "未找到原型"}</p>
						<button
							onClick={fetchPrototype}
							className="text-xs text-red-500 hover:text-red-700 mt-2"
						>
							重试
						</button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const statusInfo =
		statusConfig[prototype.status as keyof typeof statusConfig];

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
							{prototype.name}
						</h1>
						<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						ID: {prototype.id} · {prototype.code}
					</p>
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
								icon={Tag01Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">版本</span>
							<span className="font-mono font-medium">
								{prototype.version ?? "-"}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">模型</span>
							<span className="font-mono">
								{prototype.model_id || prototype.model}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">温度</span>
							<span className="font-mono">{temperature}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">最大 Tokens</span>
							<span className="font-mono">{maxTokens}</span>
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
							<span>{formatDate(prototype.created_at)}</span>
						</div>
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Clock01Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground"
							/>
							<span className="text-muted-foreground">更新时间</span>
							<span>{formatDate(prototype.updated_at)}</span>
						</div>
					</div>

					{prototype.description && (
						<div className="pt-4 border-t">
							<p className="text-sm text-muted-foreground mb-1">描述</p>
							<p className="text-sm">{prototype.description}</p>
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

						{prototype.status === "draft" && (
							<Button onClick={() => setPublishOpen(true)}>
								<HugeiconsIcon
									icon={PlayIcon}
									strokeWidth={1.5}
									className="size-4 mr-1"
								/>
								发布
							</Button>
						)}

						{prototype.status === "enabled" && (
							<>
								<Button
									variant="outline"
									onClick={handleDisable}
									disabled={actionLoading}
								>
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

						{prototype.status === "disabled" && (
							<Button onClick={handleEnable} disabled={actionLoading}>
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

			{/* Model Provider Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center justify-between">
						<span>模型配置</span>
						{prototype.provider_id && (
							<Badge variant="secondary" className="font-mono text-[10px]">
								Provider #{prototype.provider_id}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{prototype.provider_id && prototype.model_id ? (
						<>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
								<div>
									<Label className="text-xs text-muted-foreground">
										Provider ID
									</Label>
									<p className="font-mono text-sm mt-1">
										{prototype.provider_id}
									</p>
								</div>
								<div className="col-span-2">
									<Label className="text-xs text-muted-foreground">
										Model ID
									</Label>
									<p className="font-mono text-sm mt-1 text-blue-600">
										{prototype.model_id}
									</p>
								</div>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-3 border-t">
								<div>
									<Label className="text-xs text-muted-foreground">
										Temperature
									</Label>
									<p className="font-mono text-sm mt-1">{temperature}</p>
								</div>
								<div>
									<Label className="text-xs text-muted-foreground">
										Max Tokens
									</Label>
									<p className="font-mono text-sm mt-1">{maxTokens}</p>
								</div>
							</div>
						</>
					) : (
						<div className="flex items-center justify-between py-2">
							<p className="text-sm text-muted-foreground">
								未配置提供商，使用默认模型{" "}
								<span className="font-mono">{prototype.model}</span>
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Prompts Preview Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Prompts 配置</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-3 gap-4">
						{promptTypes.map((type) => {
							const content = prompts[type.key] || "未配置";
							return (
								<div key={type.key} className="p-3 border rounded-md space-y-2">
									<div className="flex items-center justify-between">
										<Badge variant="outline" className="font-mono">
											{type.label}
										</Badge>
									</div>
									<pre className="text-xs text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap line-clamp-4 max-h-24 overflow-hidden">
										{content}
									</pre>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Version History Dialog */}
			<VersionsDialog
				open={versionsOpen}
				onOpenChange={setVersionsOpen}
				prototypeId={prototypeId}
				onRollback={fetchPrototype}
			/>

			{/* Publish Dialog */}
			<PublishDialog
				open={publishOpen}
				onOpenChange={setPublishOpen}
				prototypeId={prototypeId}
				currentVersion={prototype.version ?? null}
				onSuccess={fetchPrototype}
			/>
		</div>
	);
}
