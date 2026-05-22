"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Search01Icon } from "@hugeicons/core-free-icons";
import type {
	SkillWithVersions,
	SkillVersion,
} from "@/components/agent-factory/agent-factory-types";
import { SkillOptionItem } from "./skill-option-item";

export { type SkillPickerProps } from "./types";

interface SkillPickerProps {
	skills: SkillWithVersions[];
	selectedSkills: { skill_id: number }[];
	onAddSkill: (skill: SkillWithVersions, version: SkillVersion) => void;
}

export function SkillPicker({
	skills,
	selectedSkills,
	onAddSkill,
}: SkillPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// 已选中的技能 ID 集合
	const selectedSkillIds = useMemo(
		() => new Set(selectedSkills.map((s) => s.skill_id)),
		[selectedSkills],
	);

	// 过滤：排除已选中的，且匹配搜索关键词
	const filteredSkills = useMemo(() => {
		return skills.filter((skill) => {
			const isAlreadySelected = selectedSkillIds.has(skill.id);
			if (isAlreadySelected) return false;

			if (!searchQuery.trim()) return true;
			const query = searchQuery.toLowerCase();
			return (
				skill.name.toLowerCase().includes(query) ||
				skill.code.toLowerCase().includes(query)
			);
		});
	}, [skills, selectedSkillIds, searchQuery]);

	const handleSelectSkill = (
		skill: SkillWithVersions,
		version: SkillVersion,
	) => {
		onAddSkill(skill, version);
		setIsOpen(false);
		setSearchQuery("");
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className="w-full justify-start text-left font-normal"
				>
					<HugeiconsIcon
						icon={UserGroupIcon}
						strokeWidth={1.5}
						className="size-4 mr-2"
					/>
					<span className="text-muted-foreground">点击选择技能...</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-96 p-0" align="start">
				<div className="p-3 border-b">
					<div className="relative">
						<HugeiconsIcon
							icon={Search01Icon}
							strokeWidth={1.5}
							className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
						/>
						<Input
							placeholder="搜索技能..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
							autoFocus
						/>
					</div>
				</div>
				<div className="max-h-72 overflow-y-auto py-1">
					{filteredSkills.length === 0 ? (
						<div className="px-4 py-8 text-center text-sm text-muted-foreground">
							{searchQuery ? "未找到匹配的技能" : "暂无可选技能"}
						</div>
					) : (
						filteredSkills.map((skill) => (
							<SkillOptionItem
								key={skill.id}
								skill={skill}
								onSelect={handleSelectSkill}
							/>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
