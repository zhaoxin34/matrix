"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowRight01Icon,
	Edit02Icon,
	PlayIcon,
	PauseIcon,
} from "@hugeicons/core-free-icons";
import type { Agent, AgentStatus } from "./agent-factory-types";
import { PrototypeVersionSelector } from "./prototype-version-selector";
import { updateAgent } from "@/lib/api/agent";

interface AgentFactoryCardProps {
	agent: Agent;
	workspaceCode: string;
	onDataChange?: () => void;
}

const statusConfig: Record<
	AgentStatus,
	{
		label: string;
		variant: "default" | "secondary" | "outline" | "destructive";
	}
> = {
	enabled: { label: "启用", variant: "default" },
	disabled: { label: "禁用", variant: "outline" },
	deleted: { label: "已删除", variant: "destructive" },
};

export function AgentFactoryCard({
	agent,
	workspaceCode,
	onDataChange,
}: AgentFactoryCardProps) {
	const [currentVersion, setCurrentVersion] = useState(agent.prototype_version);
	const statusInfo = statusConfig[agent.status];

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	const handleVersionChange = async (newVersion: string) => {
		try {
			await updateAgent(workspaceCode, agent.id, {
				prototype_version: newVersion,
			});
			setCurrentVersion(newVersion);
			toast.success(`已切换到版本 ${newVersion}`);
			onDataChange?.();
		} catch (err) {
			console.error("Failed to update version:", err);
			toast.error("切换版本失败");
			throw err;
		}
	};

	return (
		<Card className="group relative">
			<CardContent className="p-4 space-y-3">
				{/* Header: Name and Status */}
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<h3 className="font-medium text-sm truncate">{agent.name}</h3>
						<p className="text-xs text-muted-foreground truncate mt-0.5">
							基于 {agent.prototype?.name ?? "未知原型"}{" "}
							<PrototypeVersionSelector
								prototypeId={agent.prototype_id}
								currentVersion={currentVersion}
								onVersionChange={handleVersionChange}
							/>
						</p>
					</div>
					<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
				</div>

				{/* Description */}
				{agent.description && (
					<p className="text-xs text-muted-foreground line-clamp-2">
						{agent.description}
					</p>
				)}

				{/* Meta Info */}
				<div className="flex items-center gap-4 text-xs text-muted-foreground">
					<span className="font-mono">{agent.model}</span>
					<span>{agent.skills?.length ?? 0} 个技能</span>
					<span>{formatDate(agent.created_at)}</span>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-1 pt-2 border-t">
					<Button variant="ghost" size="sm" asChild>
						<Link href={`/workspace/${workspaceCode}/agents/${agent.id}`}>
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								strokeWidth={1.5}
								className="size-3.5"
							/>
							详情
						</Link>
					</Button>

					<Button variant="ghost" size="sm" asChild>
						<Link href={`/workspace/${workspaceCode}/agents/${agent.id}/edit`}>
							<HugeiconsIcon
								icon={Edit02Icon}
								strokeWidth={1.5}
								className="size-3.5"
							/>
							编辑
						</Link>
					</Button>

					{agent.status === "enabled" && (
						<Button variant="ghost" size="sm" className="text-muted-foreground">
							<HugeiconsIcon
								icon={PauseIcon}
								strokeWidth={1.5}
								className="size-3.5"
							/>
							禁用
						</Button>
					)}

					{agent.status === "disabled" && (
						<Button variant="ghost" size="sm" className="text-muted-foreground">
							<HugeiconsIcon
								icon={PlayIcon}
								strokeWidth={1.5}
								className="size-3.5"
							/>
							启用
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
