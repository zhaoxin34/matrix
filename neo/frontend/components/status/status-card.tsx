"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";
import type { Status } from "./status-types";
import { deleteStatus } from "@/lib/api/status";
import { CalendarIcon, TagIcon } from "lucide-react";

interface StatusCardProps {
	status: Status;
	workspaceCode: string;
	onDeleted?: () => void;
}

export function StatusCard({
	status,
	workspaceCode,
	onDeleted,
}: StatusCardProps) {
	const [deleting, setDeleting] = useState(false);

	const handleDelete = async () => {
		setDeleting(true);
		try {
			await deleteStatus(workspaceCode, status.id);
			toast.success("状态记录已删除");
			onDeleted?.();
		} catch (error) {
			const err = error as { message?: string };
			toast.error(err.message || "删除失败");
		} finally {
			setDeleting(false);
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
			second: "2-digit",
		});
	};

	const attributeKeys = Object.keys(status.attributes);

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="space-y-1 flex-1">
						<Link href={`/workspace/${workspaceCode}/status/${status.id}/edit`}>
							<h3 className="font-medium text-sm font-mono hover:text-primary cursor-pointer">
								{status.entity_name}
							</h3>
						</Link>
						{status.source && (
							<Badge variant="outline" className="text-xs">
								{status.source}
							</Badge>
						)}
					</div>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="ghost" size="sm" className="text-destructive">
								删除
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>确认删除</AlertDialogTitle>
								<AlertDialogDescription>
									确定要删除 &quot;{status.entity_name}&quot;
									的状态记录吗？此操作不可撤销。
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>取消</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDelete}
									disabled={deleting}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									{deleting ? "删除中..." : "删除"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<CalendarIcon className="size-3" />
					<span>{formatDate(status.captured_at)}</span>
				</div>

				{status.session_id && (
					<div className="text-xs text-muted-foreground font-mono">
						Session: {status.session_id}
					</div>
				)}

				{attributeKeys.length > 0 && (
					<>
						<Separator />
						<div className="space-y-2">
							<span className="text-xs text-muted-foreground flex items-center gap-1">
								<TagIcon className="size-3" />
								属性 ({attributeKeys.length})
							</span>
							<div className="grid grid-cols-2 gap-2">
								{attributeKeys.slice(0, 4).map((key) => (
									<div key={key} className="text-xs">
										<span className="text-muted-foreground">{key}: </span>
										<span className="font-mono truncate">
											{String(status.attributes[key])}
										</span>
									</div>
								))}
							</div>
							{attributeKeys.length > 4 && (
								<details className="text-xs">
									<summary className="text-muted-foreground cursor-pointer">
										查看全部 ({attributeKeys.length} 个属性)
									</summary>
									<Textarea
										value={JSON.stringify(status.attributes, null, 2)}
										readOnly
										className="text-xs font-mono h-24 resize-none mt-2"
									/>
								</details>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
