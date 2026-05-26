"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { AgentStatus } from "./agent-factory-types";

interface AgentFactoryHeaderProps {
	onSearch?: (query: string) => void;
	onStatusFilter?: (status: AgentStatus | "all") => void;
	currentStatus?: AgentStatus | "all";
	showCreateButton?: boolean;
	createUrl?: string;
	className?: string;
}

export function AgentFactoryHeader({
	onSearch,
	onStatusFilter,
	currentStatus = "all",
	showCreateButton = true,
	createUrl = "create",
	className,
}: AgentFactoryHeaderProps) {
	const [searchValue, setSearchValue] = useState("");

	const handleSearch = () => {
		onSearch?.(searchValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	return (
		<div
			className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
		>
			<div className="flex flex-1 items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<HugeiconsIcon
						icon={Search01Icon}
						strokeWidth={1.5}
						className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
					/>
					<Input
						type="search"
						placeholder="搜索 Agent 名称..."
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						onKeyDown={handleKeyDown}
						className="pl-8"
					/>
				</div>

				<div className="flex items-center gap-1">
					<Button
						variant={currentStatus === "all" ? "default" : "outline"}
						size="sm"
						onClick={() => onStatusFilter?.("all")}
					>
						全部
					</Button>
					<Button
						variant={currentStatus === "enabled" ? "default" : "outline"}
						size="sm"
						onClick={() => onStatusFilter?.("enabled")}
					>
						启用
					</Button>
					<Button
						variant={currentStatus === "disabled" ? "default" : "outline"}
						size="sm"
						onClick={() => onStatusFilter?.("disabled")}
					>
						禁用
					</Button>
				</div>
			</div>

			{showCreateButton && (
				<Button asChild>
					<Link href={createUrl}>
						<HugeiconsIcon
							icon={Add01Icon}
							strokeWidth={1.5}
							className="size-4 mr-1"
						/>
						新建 Agent
					</Link>
				</Button>
			)}
		</div>
	);
}
