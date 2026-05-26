import type {
  SkillWithVersions,
  SelectedSkill,
  SkillVersion,
} from "@/components/agent-factory/agent-factory-types";

export interface SkillPickerProps {
  skills: SkillWithVersions[];
  selectedSkills: SelectedSkill[];
  onAddSkill: (skill: SkillWithVersions, version: SkillVersion) => void;
}

export interface SkillOptionItemProps {
  skill: SkillWithVersions;
  isExpanded: boolean;
  onSkillClick: () => void;
  onSelect: (skill: SkillWithVersions, version: SkillVersion) => void;
}

export interface SelectedSkillBadgeProps {
  skill: SelectedSkill;
  onRemove: (skillId: number) => void;
}
