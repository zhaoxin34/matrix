"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import type {
	SelectablePrototype,
	SkillWithVersions,
	SelectedSkill,
	SkillVersion,
} from "@/components/agent-factory/agent-factory-types";
import {
	mockPrototypes,
	mockSkills,
	models,
} from "@/mockdata/workspace/agent-factory";
import {
	AdvancedConfigCard,
	defaultAdvancedConfig,
	type AdvancedConfigState,
} from "@/components/agent-factory/prototype-picker/advanced-config";
import {
	SkillPicker,
	SelectedSkillBadge,
} from "@/components/agent-factory/skill-picker";

// Form Schema
const createAgentSchema = z.object({
	name: z.string().min(1, "名称不能为空").max(32, "名称最多32个字符"),
	description: z.string().max(500, "描述最多500个字符").optional(),
	prototype_id: z.number().min(1, "请选择原型"),
	prototype_version: z.string().min(1, "请选择版本"),
	model: z.string().min(1, "请选择模型"),
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

// ============================================================
// Static Data
// ============================================================
// Main Page Component
// ============================================================
export default function AgentFactoryCreatePage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;

	const [selectedPrototype, setSelectedPrototype] =
		useState<SelectablePrototype | null>(null);
	const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);

	const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfigState>(
		defaultAdvancedConfig,
	);

	const prototypeMap = useMemo(
		() => new Map(mockPrototypes.map((p) => [p.id, p])),
		[],
	);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<CreateAgentForm>({
		resolver: zodResolver(createAgentSchema),
		defaultValues: {
			name: "",
			description: "",
			prototype_id: 0,
			prototype_version: "",
			model: "",
		},
	});

	const handlePrototypeSelect = useCallback(
		(prototypeId: string) => {
			const prototype = prototypeMap.get(parseInt(prototypeId));
			if (prototype) {
				setSelectedPrototype(prototype);
				setValue("prototype_id", prototype.id);
				setValue("prototype_version", "latest");
				setValue("model", prototype.model);
			} else {
				setSelectedPrototype(null);
				setValue("prototype_id", 0);
				setValue("prototype_version", "");
			}
		},
		[prototypeMap, setValue],
	);

	const handleVersionSelect = useCallback(
		(version: string) => setValue("prototype_version", version),
		[setValue],
	);

	// 添加技能（带版本）
	const handleAddSkill = useCallback(
		(skill: SkillWithVersions, version: SkillVersion) => {
			setSelectedSkills((prev) => {
				const exists = prev.find((s) => s.skill_id === skill.id);
				if (exists) {
					return prev.map((s) =>
						s.skill_id === skill.id
							? { ...s, selected_version: version.version }
							: s,
					);
				}
				return [
					...prev,
					{
						skill_id: skill.id,
						code: skill.code,
						name: skill.name,
						selected_version: version.version,
					},
				];
			});
		},
		[],
	);

	// 移除技能
	const handleRemoveSkill = useCallback((skillId: number) => {
		setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
	}, []);

	const onSubmit = async (data: CreateAgentForm) => {
		console.log("创建 Agent:", {
			...data,
			skills: selectedSkills.map((s) => ({
				skill_id: s.skill_id,
				version: s.selected_version,
			})),
			config: {
				...advancedConfig,
				retry: {
					max_attempts: advancedConfig.retryAttempts,
					backoff: advancedConfig.retryBackoff,
				},
			},
		});
		router.push(`/workspace/${workspaceCode}/agents`);
	};

	const prototypeId = watch("prototype_id");
	const prototypeVersion = watch("prototype_version");

	return (
		<div className="max-w-2xl">
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Page Header */}
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href={`/workspace/${workspaceCode}/agents`}>
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								strokeWidth={1.5}
								className="size-4"
							/>
						</Link>
					</Button>
					<div className="flex-1">
						<h1 className="text-xl font-heading font-medium">创建 Agent</h1>
						<p className="text-sm text-muted-foreground mt-1">
							基于 Prototype 创建新的 Agent 实例
						</p>
					</div>
				</div>

				{/* Basic Info Card */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">基本信息</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5">
						{/* Agent Name */}
						<div>
							<Label htmlFor="name" className="mb-1.5">
								Agent 名称 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								placeholder="输入 Agent 名称"
								{...register("name")}
							/>
							{errors.name && (
								<p className="text-sm text-destructive mt-1">
									{errors.name.message}
								</p>
							)}
						</div>

						{/* Prototype & Version */}
						<div className="flex gap-4">
							<div className="flex-1">
								<Label className="mb-1.5">
									原型 <span className="text-destructive">*</span>
								</Label>
								<Select
									value={prototypeId > 0 ? prototypeId.toString() : ""}
									onValueChange={handlePrototypeSelect}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="请选择原型" />
									</SelectTrigger>
									<SelectContent>
										{mockPrototypes.map((p) => (
											<SelectItem key={p.id} value={p.id.toString()}>
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex-1">
								<Label className="mb-1.5">
									版本 <span className="text-destructive">*</span>
								</Label>
								<Select
									value={prototypeVersion}
									onValueChange={handleVersionSelect}
									disabled={!selectedPrototype}
								>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={
												selectedPrototype ? "选择版本" : "请先选择原型"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{selectedPrototype && (
											<>
												<SelectItem value="latest">
													<div className="flex items-center gap-2">
														<span>Latest</span>
														<span className="text-sm text-muted-foreground">
															(v{selectedPrototype.current_version})
														</span>
													</div>
												</SelectItem>
												{selectedPrototype.versions.map((v) => (
													<SelectItem key={v.id} value={v.version}>
														<div className="flex items-center gap-2">
															<span>v{v.version}</span>
															{v.change_summary && (
																<span className="text-sm text-muted-foreground truncate max-w-[150px]">
																	{v.change_summary}
																</span>
															)}
														</div>
													</SelectItem>
												))}
											</>
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
						{selectedPrototype?.description && (
							<p className="text-sm text-muted-foreground -mt-2">
								{selectedPrototype.description}
							</p>
						)}

						{/* Model */}
						<div>
							<Label htmlFor="model" className="mb-1.5">
								模型 <span className="text-destructive">*</span>
							</Label>
							<Select
								value={watch("model")}
								onValueChange={(v) => setValue("model", v)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="请选择模型..." />
								</SelectTrigger>
								<SelectContent>
									{models.map((m) => (
										<SelectItem key={m.value} value={m.value}>
											{m.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedPrototype && (
								<p className="text-sm text-muted-foreground mt-1">
									原型默认: {selectedPrototype.model}
								</p>
							)}
							{errors.model && (
								<p className="text-sm text-destructive mt-1">
									{errors.model.message}
								</p>
							)}
						</div>

						{/* Description */}
						<div>
							<Label htmlFor="description" className="mb-1.5">
								描述
							</Label>
							<Textarea
								id="description"
								placeholder="输入 Agent 描述（可选）"
								rows={2}
								{...register("description")}
							/>
							{errors.description && (
								<p className="text-sm text-destructive mt-1">
									{errors.description.message}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Skills Card */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm flex items-center gap-2">
							<HugeiconsIcon
								icon={UserGroupIcon}
								strokeWidth={1.5}
								className="size-4"
							/>
							选择技能
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* 技能选择器 */}
						<SkillPicker
							skills={mockSkills}
							selectedSkills={selectedSkills}
							onAddSkill={handleAddSkill}
						/>

						{/* 已选技能 */}
						{selectedSkills.length > 0 ? (
							<div>
								<Label className="text-sm text-muted-foreground mb-2 block">
									已选择 ({selectedSkills.length})
								</Label>
								<div className="flex flex-wrap gap-2">
									{selectedSkills.map((skill) => (
										<SelectedSkillBadge
											key={skill.skill_id}
											skill={skill}
											onRemove={handleRemoveSkill}
										/>
									))}
								</div>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								点击上方按钮选择技能，已选择的技能将显示在这里
							</p>
						)}
					</CardContent>
				</Card>

				{/* Advanced Config Card */}
				<AdvancedConfigCard
					value={advancedConfig}
					onChange={setAdvancedConfig}
				/>
				<div className="flex items-center justify-end gap-2">
					<Button variant="outline" type="button" asChild>
						<Link href={`/workspace/${workspaceCode}/agents`}>取消</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						创建 Agent
					</Button>
				</div>
			</form>
		</div>
	);
}
