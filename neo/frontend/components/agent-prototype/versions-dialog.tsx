"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { RotateLeft01Icon } from "@hugeicons/core-free-icons";
import type { AgentPrototypeVersion } from "./agent-prototype-types";

// Mock data for demonstration
const mockVersions: AgentPrototypeVersion[] = [
	{
		id: 3,
		agent_prototype_id: 1,
		version: "1.2.0",
		prompts_snapshot: {},
		config_snapshot: {},
		change_summary: "优化客服对话流程，增加情绪识别",
		created_by: 1,
		created_at: "2026-05-15T14:30:00Z",
	},
	{
		id: 2,
		agent_prototype_id: 1,
		version: "1.1.0",
		prompts_snapshot: {},
		config_snapshot: {},
		change_summary: "增加工单创建工具",
		created_by: 1,
		created_at: "2026-05-08T10:00:00Z",
	},
	{
		id: 1,
		agent_prototype_id: 1,
		version: "1.0.0",
		prompts_snapshot: {},
		config_snapshot: {},
		change_summary: "初始版本",
		created_by: 1,
		created_at: "2026-05-01T08:00:00Z",
	},
];

interface VersionsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	prototypeId: string;
	onRollback?: () => void;
}

export function VersionsDialog({
	open,
	onOpenChange,
	prototypeId,
	onRollback,
}: VersionsDialogProps) {
	const [versions, setVersions] = useState<AgentPrototypeVersion[]>([]);
	const [loading, setLoading] = useState(false);
	const [rollingBack, setRollingBack] = useState<number | null>(null);

	const fetchVersions = useCallback(async () => {
		if (!open) return;
		
		setLoading(true);
		
		try {
			const response = await fetch(`/api/v1/agent_prototype/${prototypeId}/versions`);
			const result = await response.json();

			if (result.code === 0 && result.data?.list && result.data.list.length > 0) {
				setVersions(result.data.list);
			} else {
				// Use mock data if API returns no data
				setVersions(mockVersions);
			}
		} catch (error) {
			console.error("Failed to fetch versions:", error);
			// Fallback to mock data on error
			setVersions(mockVersions);
		} finally {
			setLoading(false);
		}
	}, [open, prototypeId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchVersions();
	}, [fetchVersions]);

	const handleRollback = async (version: AgentPrototypeVersion) => {
		setRollingBack(version.id);
		try {
			const response = await fetch(
				`/api/v1/agent_prototype/${prototypeId}/rollback`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ version_id: version.id }),
				},
			);
			const result = await response.json();

			if (result.code === 0) {
				onRollback?.();
				onOpenChange(false);
			}
		} catch (error) {
			console.error("Failed to rollback:", error);
		} finally {
			setRollingBack(null);
		}
	};

	const displayVersions = versions.length > 0 ? versions : mockVersions;

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString("zh-CN", {
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>版本历史</DialogTitle>
					<DialogDescription>查看并回滚到历史版本</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 max-h-80 overflow-y-auto min-h-[200px]">
					{loading ? (
						<>
							<div className="p-3 border rounded-md space-y-2">
								<Skeleton className="h-4 w-1/3" />
								<Skeleton className="h-3 w-2/3" />
								<Skeleton className="h-3 w-1/3" />
							</div>
							<div className="p-3 border rounded-md space-y-2">
								<Skeleton className="h-4 w-1/3" />
								<Skeleton className="h-3 w-2/3" />
								<Skeleton className="h-3 w-1/3" />
							</div>
							<div className="p-3 border rounded-md space-y-2">
								<Skeleton className="h-4 w-1/3" />
								<Skeleton className="h-3 w-2/3" />
								<Skeleton className="h-3 w-1/3" />
							</div>
						</>
					) : displayVersions.length > 0 ? (
						displayVersions.map((version, index) => (
							<div key={version.id} className="p-3 border rounded-md space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="font-mono">
											v{version.version}
										</Badge>
										{index === 0 && (
											<Badge variant="default" className="text-xs">
												当前版本
											</Badge>
										)}
									</div>
									{index !== 0 && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleRollback(version)}
											disabled={rollingBack === version.id}
										>
											<HugeiconsIcon
												icon={RotateLeft01Icon}
												strokeWidth={1.5}
												className="size-3.5 mr-1"
											/>
											{rollingBack === version.id ? "回滚中..." : "回滚"}
										</Button>
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									{version.change_summary ?? "无变更说明"}
								</p>
								<p className="text-xs text-muted-foreground/70">
									{formatDate(version.created_at)}
								</p>
							</div>
						))
					) : (
						<div className="py-8 text-center">
							<p className="text-sm text-muted-foreground">暂无版本历史</p>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						关闭
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}