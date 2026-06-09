"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AgentMode } from "../types";
import { MODE_INFO } from "../types";

interface ModeSelectorProps {
	value: AgentMode;
	onChange: (mode: AgentMode) => void;
	disabled?: boolean;
}

export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
	const modes: AgentMode[] = ["learn", "guide", "active"];

	return (
		<div className="space-y-2">
			<div className="text-xs font-medium text-muted-foreground">模式选择</div>
			<div className="flex gap-2">
				{modes.map((mode) => {
					const info = MODE_INFO[mode];
					const isActive = value === mode;

					return (
						<Button
							key={mode}
							variant={isActive ? "default" : "outline"}
							size="sm"
							onClick={() => onChange(mode)}
							disabled={disabled}
							className={cn(
								"flex flex-col items-center gap-0.5 h-auto py-2 px-3 min-w-[70px]",
								isActive && "border-l-2 border-l-primary",
							)}
						>
							<span className="text-base">{info.icon}</span>
							<span className="text-xs">{info.label}</span>
						</Button>
					);
				})}
			</div>
			{/* 当前模式描述 */}
			<div className="text-xs text-muted-foreground pl-1">
				{MODE_INFO[value].description}
			</div>
		</div>
	);
}
