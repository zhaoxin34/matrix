"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Edit02Icon,
	PlayIcon,
	PauseIcon,
	Delete02Icon,
	ArrowRight01Icon,
	Clock01Icon,
} from "@hugeicons/core-free-icons";
import type { AgentPrototype } from "./agent-prototype-types";

interface AgentPrototypeCardProps {
	prototype: AgentPrototype;
	showActions?: boolean;
}

const statusConfig = {
	draft: {
		label: "草稿",
		variant: "secondary" as const,
	},
	enabled: {
		label: "已启用",
		variant: "default" as const,
	},
	disabled: {
		label: "已禁用",
		variant: "outline" as const,
	},
};

export function AgentPrototypeCard({
	prototype,
	showActions = true,
}: AgentPrototypeCardProps) {
	const statusInfo = statusConfig[prototype.status];

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	return (
		<Card className="group relative">
			<CardContent className="p-4 space-y-3">
				{/* Header: Name and Status */}
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<h3 className="font-medium text-sm truncate">{prototype.name}</h3>
						<p className="text-xs text-muted-foreground truncate mt-0.5">
							{prototype.code}
						</p>
					</div>
					<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
				</div>

				{/* Description */}
				{prototype.description && (
					<p className="text-xs text-muted-foreground line-clamp-2">
						{prototype.description}
					</p>
				)}

				{/* Meta Info */}
				<div className="flex items-center gap-4 text-xs text-muted-foreground">
					{prototype.version && (
						<span className="font-mono">v{prototype.version}</span>
					)}
					<span>{formatDate(prototype.created_at)}</span>
				</div>

				{/* Actions */}
				{showActions && (
					<div className="flex items-center gap-1 pt-2 border-t">
						<Button variant="ghost" size="sm" asChild>
							<Link href={`/admin/agent-prototype/${prototype.id}`}>
								<HugeiconsIcon
									icon={ArrowRight01Icon}
									strokeWidth={1.5}
									className="size-3.5"
								/>
								详情
							</Link>
						</Button>

						{prototype.status === "draft" && (
							<>
								<Button variant="ghost" size="sm" asChild>
									<Link href={`/admin/agent-prototype/${prototype.id}/edit`}>
										<HugeiconsIcon
											icon={Edit02Icon}
											strokeWidth={1.5}
											className="size-3.5"
										/>
										编辑
									</Link>
								</Button>
								<Button variant="ghost" size="sm" className="text-destructive">
									<HugeiconsIcon
										icon={Delete02Icon}
										strokeWidth={1.5}
										className="size-3.5"
									/>
									删除
								</Button>
							</>
						)}

						{prototype.status === "enabled" && (
							<>
								<Button variant="ghost" size="sm" asChild>
									<Link href={`/admin/agent-prototype/${prototype.id}/edit`}>
										<HugeiconsIcon
											icon={Edit02Icon}
											strokeWidth={1.5}
											className="size-3.5"
										/>
										编辑
									</Link>
								</Button>
								<Button variant="ghost" size="sm">
									<HugeiconsIcon
										icon={PauseIcon}
										strokeWidth={1.5}
										className="size-3.5"
									/>
									禁用
								</Button>
								<Button variant="ghost" size="sm">
									<HugeiconsIcon
										icon={Clock01Icon}
										strokeWidth={1.5}
										className="size-3.5"
									/>
									历史
								</Button>
							</>
						)}

						{prototype.status === "disabled" && (
							<>
								<Button variant="ghost" size="sm">
									<HugeiconsIcon
										icon={PlayIcon}
										strokeWidth={1.5}
										className="size-3.5"
									/>
									启用
								</Button>
								<Button variant="ghost" size="sm">
									<HugeiconsIcon
										icon={Clock01Icon}
										strokeWidth={1.5}
										className="size-3.5"
									/>
									历史
								</Button>
							</>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
