"use client";

import { cn } from "@/lib/utils";

/**
 * Minimal shadcn-style progress bar. Not animated — the consumer should
 * bump `value` to drive updates. Keeps the dependency footprint tiny
 * since the project doesn't pull in @radix-ui/react-progress.
 */
export function Progress({
	value = 0,
	className,
}: {
	value?: number;
	className?: string;
}) {
	const pct = Math.max(0, Math.min(100, value));
	return (
		<div
			role="progressbar"
			aria-valuenow={pct}
			aria-valuemin={0}
			aria-valuemax={100}
			className={cn(
				"relative h-2 w-full overflow-hidden rounded-full bg-secondary",
				className,
			)}
		>
			<div
				className="h-full bg-primary transition-all"
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}
