"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LEVELS: Array<{ min: number; label: string; className: string }> = [
	{ min: 0.8, label: "high", className: "bg-green-100 text-green-800" },
	{ min: 0.5, label: "medium", className: "bg-yellow-100 text-yellow-800" },
	{ min: 0, label: "low", className: "bg-red-100 text-red-800" },
];

export function ConfidenceBadge({ value }: { value: number }) {
	const pct = Math.round(value * 100);
	const level = LEVELS.find((l) => value >= l.min) ?? LEVELS[LEVELS.length - 1];
	return (
		<Badge
			variant="outline"
			className={cn("border-0 font-medium", level.className)}
		>
			{pct}%
		</Badge>
	);
}
