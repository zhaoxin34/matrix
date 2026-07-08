"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowDown01Icon,
	Search01Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { getVersionHistory } from "@/lib/api/agent-prototype";
import type { AgentPrototypeVersionListResponse } from "@/lib/api/agent-prototype";

interface PrototypeVersionSelectorProps {
	prototypeId: number;
	currentVersion: string;
	onVersionChange: (newVersion: string) => Promise<void>;
}

const PAGE_SIZE = 10;

export function PrototypeVersionSelector({
	prototypeId,
	currentVersion,
	onVersionChange,
}: PrototypeVersionSelectorProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [versions, setVersions] = useState<
		Array<{ id: number; version: string }>
	>([]);
	const [allVersions, setAllVersions] = useState<
		Array<{ id: number; version: string }>
	>([]);
	const [search, setSearch] = useState("");
	const [hasMore, setHasMore] = useState(false);
	const [updating, setUpdating] = useState(false);

	const fetchVersions = useCallback(async () => {
		if (!prototypeId) return;

		setLoading(true);
		try {
			const response: AgentPrototypeVersionListResponse =
				await getVersionHistory(prototypeId);
			const versionList = response.items.map((v) => ({
				id: v.id,
				version: v.version,
			}));
			// Sort by version descending (newest first)
			versionList.sort((a, b) => compareVersions(a.version, b.version) * -1);
			setAllVersions(versionList);
			// Show first PAGE_SIZE items
			setVersions(versionList.slice(0, PAGE_SIZE));
			setHasMore(versionList.length > PAGE_SIZE);
		} catch (err) {
			console.error("Failed to fetch versions:", err);
		} finally {
			setLoading(false);
		}
	}, [prototypeId]);

	useEffect(() => {
		if (open && allVersions.length === 0) {
			fetchVersions();
		}
	}, [open, fetchVersions, allVersions.length]);

	const loadMore = () => {
		const currentCount = search ? filteredVersions.length : versions.length;
		const currentVersions = search ? filteredVersions : allVersions;
		const nextBatch = currentVersions.slice(
			currentCount,
			currentCount + PAGE_SIZE,
		);

		if (search) {
			// When searching, we filter and load more from filtered results
			const filtered = allVersions.filter((v) =>
				v.version.toLowerCase().includes(search.toLowerCase()),
			);
			setVersions(filtered.slice(0, currentCount + PAGE_SIZE));
			setHasMore(filtered.length > currentCount + PAGE_SIZE);
		} else {
			setVersions([...versions, ...nextBatch]);
			setHasMore(currentVersions.length > currentCount + PAGE_SIZE);
		}
	};

	const filteredVersions = search
		? allVersions.filter((v) =>
				v.version.toLowerCase().includes(search.toLowerCase()),
			)
		: versions;

	const handleSelectVersion = async (version: string) => {
		if (version === currentVersion) {
			setOpen(false);
			return;
		}

		setUpdating(true);
		try {
			await onVersionChange(version);
			setOpen(false);
			setSearch("");
		} catch (err) {
			console.error("Failed to update version:", err);
		} finally {
			setUpdating(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-auto p-0 text-secondary-foreground hover:text-secondary-foreground hover:bg-accent font-mono text-xs"
				>
					v{currentVersion}
					<HugeiconsIcon
						icon={ArrowDown01Icon}
						strokeWidth={1.5}
						className="size-3 ml-0.5 text-secondary-foreground"
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-0" align="start">
				<div className="p-2 border-b">
					<div className="relative">
						<HugeiconsIcon
							icon={Search01Icon}
							strokeWidth={1.5}
							className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
						/>
						<Input
							placeholder="搜索版本..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-7 h-8 text-xs"
						/>
					</div>
				</div>

				<div className="max-h-64 overflow-y-auto">
					{loading ? (
						<div className="p-2 space-y-2">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-8 w-full" />
							))}
						</div>
					) : filteredVersions.length === 0 ? (
						<div className="p-4 text-center text-xs text-muted-foreground">
							{search ? "未找到匹配版本" : "暂无版本"}
						</div>
					) : (
						<div className="p-1">
							{filteredVersions.map((v) => (
								<button
									key={v.id}
									onClick={() => handleSelectVersion(v.version)}
									disabled={updating}
									className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-sm hover:bg-accent transition-colors disabled:opacity-50"
								>
									<span className="font-mono">{v.version}</span>
									{v.version === currentVersion && (
										<HugeiconsIcon
											icon={CheckmarkCircle01Icon}
											strokeWidth={1.5}
											className="size-3.5 text-green-600"
										/>
									)}
								</button>
							))}

							{hasMore && !search && (
								<button
									onClick={loadMore}
									className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm"
								>
									加载更多...
								</button>
							)}
						</div>
					)}
				</div>

				{updating && (
					<div className="p-2 border-t text-center">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto" />
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}

/**
 * Compare two version strings (e.g., "1.0.0" vs "1.0.1")
 * Returns -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
	const partsA = a.split(".").map(Number);
	const partsB = b.split(".").map(Number);

	for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
		const numA = partsA[i] || 0;
		const numB = partsB[i] || 0;

		if (numA < numB) return -1;
		if (numA > numB) return 1;
	}

	return 0;
}
