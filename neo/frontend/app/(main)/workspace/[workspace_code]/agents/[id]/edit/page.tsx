"use client";

import { useState, useCallback, useEffect } from "react";
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
	SelectedSkill,
	SkillWithVersions,
	SkillVersion,
} from "@/components/agent-factory/agent-factory-types";
import {
	mockPrototypes,
	mockSkills,
	models,
} from "@/mockdata/workspace/agent-factory";
import {
	AdvancedConfigCard,
	type AdvancedConfigState,
} from "@/components/agent-factory/advanced-config";
import {
	SkillPicker,
	SelectedSkillBadge,
} from "@/components/agent-factory/skill-picker";
import { getAgent, updateAgent, type AgentResponse } from "@/lib/api/agent";

// Form Schema
const editAgentSchema = z.object({
	name: z.string().min(1, "名称不能为空").max(32, "名称最多32个字符"),
	description: z.string().max(500, "描述最多500个字符").optional(),
	model: z.string().min(1, "请选择模型"),
});

type EditAgentForm = z.infer<typeof editAgentSchema>;

/**
 * Agent Factory Edit Page
 *
 * 路由: /workspace/{workspace_code}/agents/{id}/edit
 * 角色: Workspace 成员
 * 功能: 编辑 Agent 配置
 */
export default function AgentFactoryEditPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;
	const agentId = parseInt(params.id as string, 10);

	const [agent, setAgent] = useState<AgentResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 已选中的技能
	const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);

	// 高级配置
	const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfigState>({
		temperature: 0.7,
		maxTokens: 4096,
		thinking: "medium",
		timeout: 60,
		retryAttempts: 3,
		retryBackoff: "exponential",
	});

	// 获取当前 agent 对应的原型
	const prototype = agent
		? (mockPrototypes.find((p) => p.id === agent.prototype_id) ?? null)
		: null;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<EditAgentForm>({
		resolver: zodResolver(editAgentSchema),
		defaultValues: {
			name: "",
			description: "",
			model: "",
		},
	});

	// 加载Agent详情
	useEffect(() => {
		const fetchAgentData = async () => {
			try {
				setLoading(true);
				const data = await getAgent(workspaceCode, agentId);
				setAgent(data);

				// 设置表单默认值
				setValue("name", data.name);
				setValue("description", data.description || "");
				setValue("model", data.model);

				// 从config中恢复高级配置
				if (data.config) {
					const config = data.config as Record<string, unknown>;
					setAdvancedConfig({
						temperature: (config.temperature as number) ?? 0.7,
						maxTokens: (config.max_tokens as number) ?? 4096,
						thinking:
							(config.thinking as "low" | "medium" | "high") ?? "medium",
						timeout: (config.timeout as number) ?? 60,
						retryAttempts: (config.max_attempts as number) ?? 3,
						retryBackoff:
							(config.backoff as "linear" | "exponential") ?? "exponential",
					});
				}

				// 将 skills（[{skill_id, version}, ...]）转换为 SelectedSkill[]，
				// 通过 mockSkills 反查 code/name；若查不到则降级使用占位值，避免渲染对象。
				setSelectedSkills(
					data.skills.map((skill) => {
						const meta = mockSkills.find((s) => s.id === skill.skill_id);
						return {
							skill_id: skill.skill_id,
							code: meta?.code ?? `skill_${skill.skill_id}`,
							name: meta?.name ?? `技能 #${skill.skill_id}`,
							selected_version: skill.version,
						};
					}),
				);
			} catch (err) {
				console.error("Failed to fetch agent:", err);
				setError(err instanceof Error ? err.message : "获取 Agent 详情失败");
			} finally {
				setLoading(false);
			}
		};

		fetchAgentData();
	}, [workspaceCode, agentId, setValue]);

	// 添加技能
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

	const onSubmit = async (data: EditAgentForm) => {
		try {
			setSubmitting(true);
			setError(null);

			await updateAgent(workspaceCode, agentId, {
				name: data.name,
				description: data.description,
				model: data.model,
				skills: selectedSkills.map((s) => ({
					skill_id: s.skill_id,
					version: s.selected_version,
				})),
				config: {
					temperature: advancedConfig.temperature,
					max_tokens: advancedConfig.maxTokens,
					thinking: advancedConfig.thinking,
					timeout: advancedConfig.timeout,
					max_attempts: advancedConfig.retryAttempts,
					backoff: advancedConfig.retryBackoff,
				},
			});

			router.push(`/workspace/${workspaceCode}/agents/${agentId}`);
		} catch (err) {
			console.error("Failed to update agent:", err);
			setError(err instanceof Error ? err.message : "更新 Agent 失败");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
			</div>
		);
	}

	if (error && !agent) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<p className="text-sm text-destructive mb-2">{error}</p>
				<Button onClick={() => window.location.reload()}>点击重试</Button>
			</div>
		);
	}

	if (!agent) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<p className="text-sm text-muted-foreground">Agent 不存在</p>
				<Button variant="link" asChild className="mt-2">
					<Link href={`/workspace/${workspaceCode}/agents`}>返回列表</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="max-w-2xl">
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Page Header */}
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href={`/workspace/${workspaceCode}/agents/${agentId}`}>
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								strokeWidth={1.5}
								className="size-4"
							/>
						</Link>
					</Button>
					<div className="flex-1">
						<h1 className="text-xl font-heading font-medium">编辑 Agent</h1>
						<p className="text-sm text-muted-foreground mt-1">
							修改 Agent 配置和运行参数
						</p>
					</div>
				</div>

				{error && (
					<div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
						{error}
					</div>
				)}

				{/* Basic Info Card */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">基本信息</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5">
						{/* Prototype Info (read-only) */}
						{prototype && (
							<div className="p-3 bg-muted rounded-md">
								<div className="flex items-center gap-2 text-sm">
									<span className="text-muted-foreground">基于原型:</span>
									<span className="font-medium">
										{prototype.name} (v{agent.prototype_version})
									</span>
								</div>
								<p className="text-sm text-muted-foreground mt-1">
									原型版本在创建时锁定，如需更改请创建新的 Agent
								</p>
							</div>
						)}

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
							<p className="text-sm text-muted-foreground mt-1">
								可覆盖原型默认的模型配置
							</p>
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

				{/* Actions */}
				<div className="flex items-center justify-end gap-2">
					<Button variant="outline" type="button" asChild>
						<Link href={`/workspace/${workspaceCode}/agents/${agentId}`}>
							取消
						</Link>
					</Button>
					<Button type="submit" disabled={submitting}>
						{submitting ? "保存中..." : "保存更改"}
					</Button>
				</div>
			</form>
		</div>
	);
}
