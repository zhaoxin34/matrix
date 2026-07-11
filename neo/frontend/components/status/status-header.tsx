"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import { listStatus } from "@/lib/api/status";

interface StatusHeaderProps {
	onEntityTypeFilter: (entityType: string) => void;
	onEntityIdSearch: (entityId: string) => void;
	currentEntityType: string;
	currentEntityId: string;
	workspaceCode: string;
	className?: string;
}

// Extract unique entity types from status list
function extractEntityTypes(statuses: { entity_type: string }[]): string[] {
	const typeSet = new Set<string>();
	statuses.forEach((s) => typeSet.add(s.entity_type));
	return Array.from(typeSet).sort();
}

export function StatusHeader({
	onEntityTypeFilter,
	onEntityIdSearch,
	currentEntityType,
	currentEntityId,
	workspaceCode,
	className,
}: StatusHeaderProps) {
	const [entityTypes, setEntityTypes] = useState<string[]>([]);
	const [searchValue, setSearchValue] = useState(currentEntityId);

	useEffect(() => {
		// Load entity types from the first page of all statuses
		listStatus(workspaceCode, { page: 1, page_size: 100 })
			.then((response) => {
				const types = extractEntityTypes(response.list);
				setEntityTypes(types);
			})
			.catch(() => {
				// Ignore errors
			});
	}, [workspaceCode]);

	const handleSearchChange = (value: string) => {
		setSearchValue(value);
	};

	const handleSearchSubmit = () => {
		onEntityIdSearch(searchValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearchSubmit();
		}
	};

	return (
		<div className={`flex items-center gap-4 ${className ?? ""}`}>
			<div className="relative flex-1 max-w-md">
				<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					placeholder="搜索实体 ID..."
					value={searchValue}
					onChange={(e) => handleSearchChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleSearchSubmit}
					className="pl-9"
				/>
			</div>

			<Select
				value={currentEntityType || "all"}
				onValueChange={(v) => {
					onEntityTypeFilter(v === "all" ? "" : v);
				}}
			>
				<SelectTrigger className="w-[200px]">
					<SelectValue placeholder="筛选实体类型" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">全部类型</SelectItem>
					{entityTypes.map((type) => (
						<SelectItem key={type} value={type}>
							{type}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
