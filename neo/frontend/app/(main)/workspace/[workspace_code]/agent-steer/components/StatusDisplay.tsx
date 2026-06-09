"use client";

import { cn } from "@/lib/utils";
import type { StatusType } from "../types";
import { STATUS_INFO } from "../types";

interface StatusDisplayProps {
	status: StatusType;
	className?: string;
}

export function StatusDisplay({ status, className }: StatusDisplayProps) {
	const info = STATUS_INFO[status];

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{/* 状态指示器 */}
			<div className="relative flex items-center justify-center">
				<span
					className={cn(
						"w-2.5 h-2.5 rounded-full",
						info.color === "gray" && "bg-gray-400",
						info.color === "green" && "bg-green-500",
						info.color === "yellow" && "bg-yellow-500",
						info.color === "blue" && "bg-blue-500",
						status === "recording" && "animate-pulse",
					)}
				/>
				{/* 录制时的脉冲环 */}
				{status === "recording" && (
					<span className="absolute w-2.5 h-2.5 rounded-full bg-green-500/30 animate-ping" />
				)}
			</div>

			{/* 状态文字 */}
			<span
				className={cn(
					"text-xs font-medium",
					info.color === "gray" && "text-gray-500",
					info.color === "green" && "text-green-600",
					info.color === "yellow" && "text-yellow-600",
					info.color === "blue" && "text-blue-600",
				)}
			>
				{info.label}
			</span>
		</div>
	);
}
