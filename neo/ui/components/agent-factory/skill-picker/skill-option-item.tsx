"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type {
	SkillWithVersions,
	SkillVersion,
} from "@/components/agent-factory/agent-factory-types";

export { type SkillOptionItemProps } from "./types";

interface SkillOptionItemProps {
	skill: SkillWithVersions;
	onSelect: (skill: SkillWithVersions, version: SkillVersion) => void;
}

export function SkillOptionItem({ skill, onSelect }: SkillOptionItemProps) {
	const [isVersionOpen, setIsVersionOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// 点击外部关闭
	useEffect(() => {
		if (!isVersionOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsVersionOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isVersionOpen]);

	return (
		<div className="relative" ref={ref}>
			<div
				className="px-3 py-2 hover:bg-accent transition-colors cursor-pointer"
				onClick={() => setIsVersionOpen(!isVersionOpen)}
			>
				<div className="flex items-center justify-between">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<span className="font-medium truncate">{skill.name}</span>
							<span className="text-xs text-muted-foreground">
								v{skill.current_version}
							</span>
						</div>
						<p className="text-sm text-muted-foreground truncate">
							{skill.code}
						</p>
					</div>
					<span className="text-xs text-muted-foreground ml-2">
						点击选择版本
					</span>
				</div>
			</div>
			{isVersionOpen && (
				<div className="absolute z-50 mt-1 w-72 bg-background border rounded-lg shadow-lg">
					<div className="p-3 border-b">
						<p className="font-medium text-sm">{skill.name}</p>
						<p className="text-xs text-muted-foreground">
							当前版本: v{skill.current_version}
						</p>
					</div>
					<div className="py-1 max-h-48 overflow-y-auto">
						{/* Latest 选项 */}
						<button
							className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
							onClick={() => {
								onSelect(skill, {
									id: -1,
									version: "latest",
									change_summary: skill.current_version,
									created_at: "",
								});
								setIsVersionOpen(false);
							}}
						>
							<div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">Latest</span>
									<Badge variant="secondary" className="text-xs py-0">
										v{skill.current_version}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground mt-0.5">
									始终使用最新版本
								</p>
							</div>
						</button>
						{/* 具体版本列表 */}
						{skill.versions.map((v) => (
							<button
								key={v.id}
								className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
								onClick={() => {
									onSelect(skill, v);
									setIsVersionOpen(false);
								}}
							>
								<div>
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium">v{v.version}</span>
										{v.version === skill.current_version && (
											<Badge variant="secondary" className="text-xs py-0">
												Current
											</Badge>
										)}
									</div>
									{v.change_summary && (
										<p className="text-xs text-muted-foreground mt-0.5">
											{v.change_summary}
										</p>
									)}
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
