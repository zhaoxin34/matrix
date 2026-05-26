"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Tab {
	key: string;
	label: string;
	description?: string;
}

interface EnhancedTabsProps {
	tabs: Tab[];
	activeTab: string;
	onChange: (key: string) => void;
	className?: string;
}

export function EnhancedTabs({
	tabs,
	activeTab,
	onChange,
	className,
}: EnhancedTabsProps) {
	return (
		<div
			className={cn(
				"flex border-b bg-muted/30 rounded-t-md overflow-x-auto",
				className,
			)}
		>
			{tabs.map((tab) => (
				<button
					key={tab.key}
					onClick={() => onChange(tab.key)}
					className={cn(
						"relative px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap",
						"hover:bg-muted/50",
						activeTab === tab.key
							? "text-primary bg-background"
							: "text-muted-foreground",
					)}
				>
					<span>{tab.label}</span>
					{activeTab === tab.key && (
						<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
					)}
				</button>
			))}
		</div>
	);
}

// 简化版本的 Tab 组件（使用下划线样式）
interface SimpleTabsProps {
	tabs: Tab[];
	activeTab: string;
	onChange: (key: string) => void;
	className?: string;
}

export function SimpleTabs({
	tabs,
	activeTab,
	onChange,
	className,
}: SimpleTabsProps) {
	return (
		<div className={cn("flex gap-1 p-1 bg-muted rounded-md w-fit", className)}>
			{tabs.map((tab) => (
				<button
					key={tab.key}
					onClick={() => onChange(tab.key)}
					className={cn(
						"px-3 py-1.5 text-xs font-medium rounded transition-all",
						activeTab === tab.key
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
