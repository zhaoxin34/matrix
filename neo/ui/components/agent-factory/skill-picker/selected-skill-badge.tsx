"use client";

import { Badge } from "@/components/ui/badge";
import type { SelectedSkill } from "@/components/agent-factory/agent-factory-types";

export { type SelectedSkillBadgeProps } from "./types";

interface SelectedSkillBadgeProps {
	skill: SelectedSkill;
	onRemove: (skillId: number) => void;
}

export function SelectedSkillBadge({
	skill,
	onRemove,
}: SelectedSkillBadgeProps) {
	return (
		<Badge variant="default" className="flex items-center gap-2 py-1.5 px-3">
			<span>{skill.name}</span>
			<span className="text-xs opacity-80">v{skill.selected_version}</span>
			<button
				className="ml-1 hover:opacity-100 opacity-60"
				onClick={() => onRemove(skill.skill_id)}
			>
				×
			</button>
		</Badge>
	);
}
