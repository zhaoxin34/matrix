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
import {
	ArrowLeft01Icon,
	Add01Icon,
	Settings02Icon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import type {
	SelectablePrototype,
	Skill,
} from "@/components/agent-factory/agent-factory-types";

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
const mockPrototypes: SelectablePrototype[] = [
	{
		id: 1,
		code: "customer-service-pro",
		name: "客服助手 Pro",
		description: "高级客服Agent，支持多轮对话和工单创建",
		current_version: "1.2.0",
		versions: [
			{
				id: 11,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-01-01",
			},
			{
				id: 12,
				version: "1.1.0",
				change_summary: "支持工单创建",
				created_at: "2026-03-01",
			},
			{
				id: 13,
				version: "1.2.0",
				change_summary: "优化对话逻辑",
				created_at: "2026-05-01",
			},
		],
		model: "gpt-4o",
	},
	{
		id: 2,
		code: "sales-assistant",
		name: "销售助手",
		description: "辅助销售团队进行客户跟进和报价生成",
		current_version: "1.0.0",
		versions: [
			{
				id: 21,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-04-01",
			},
		],
		model: "gpt-4o-mini",
	},
	{
		id: 3,
		code: "data-analyst",
		name: "数据分析助手",
		description: "支持 SQL 生成和可视化建议",
		current_version: "2.0.0",
		versions: [
			{
				id: 31,
				version: "1.0.0",
				change_summary: "初始版本",
				created_at: "2026-02-01",
			},
			{
				id: 32,
				version: "2.0.0",
				change_summary: "新增可视化建议",
				created_at: "2026-05-15",
			},
		],
		model: "gpt-4o",
	},
];

const mockSkills: Skill[] = [
	{ id: 1, code: "faq", name: "FAQ 查询" },
	{ id: 2, code: "ticket", name: "工单创建" },
	{ id: 3, code: "crm", name: "CRM 集成" },
	{ id: 4, code: "knowledge", name: "知识库查询" },
	{ id: 5, code: "email", name: "邮件发送" },
];

const models = [
	{ value: "gpt-4o", label: "GPT-4o" },
	{ value: "gpt-4o-mini", label: "GPT-4o Mini" },
	{ value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
	{ value: "claude-3-haiku", label: "Claude 3 Haiku" },
] as const;

const thinkingOptions = [
	{ value: "low", label: "低 - 快速响应" },
	{ value: "medium", label: "中 - 平衡速度与质量" },
	{ value: "high", label: "高 - 深度思考" },
] as const;

// ============================================================
// Extracted Components
// ============================================================
function SkillBadge({
	skill,
	isSelected,
	onClick,
}: {
	skill: Skill;
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		<Badge
			variant={isSelected ? "default" : "outline"}
			className="cursor-pointer"
			onClick={onClick}
		>
			{isSelected && (
				<HugeiconsIcon
					icon={Add01Icon}
					strokeWidth={1.5}
					className="size-3 mr-1"
				/>
			)}
			{skill.name}
		</Badge>
	);
}

// ============================================================
// Main Page Component
// ============================================================
export default function AgentFactoryCreatePage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;

	const [selectedPrototype, setSelectedPrototype] =
		useState<SelectablePrototype | null>(null);
	const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
	const [showAdvanced, setShowAdvanced] = useState(false);

	const [advancedConfig, setAdvancedConfig] = useState({
		temperature: 0.7,
		maxTokens: 4096,
		thinking: "medium" as "low" | "medium" | "high",
		timeout: 60,
		retryAttempts: 3,
		retryBackoff: "exponential" as "linear" | "exponential",
	});

	const selectedSkillIds = useMemo(
		() => new Set(selectedSkills.map((s) => s.id)),
		[selectedSkills],
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

	const toggleSkill = useCallback((skill: Skill) => {
		setSelectedSkills((prev) => {
			const ids = prev.map((s) => s.id);
			return ids.includes(skill.id)
				? prev.filter((s) => s.id !== skill.id)
				: [...prev, skill];
		});
	}, []);

	const onSubmit = async (data: CreateAgentForm) => {
		console.log("创建 Agent:", {
			...data,
			skills: selectedSkills.map((s) => s.id),
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
					<p className="text-xs text-muted-foreground mt-1">
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
					{/* Prototype & Version - 级联选择 (2列网格) */}
					<div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
						<div>
							<Label className="mb-1.5">
								原型 <span className="text-destructive">*</span>
							</Label>
							<Select
								value={prototypeId > 0 ? prototypeId.toString() : ""}
								onValueChange={handlePrototypeSelect}
							>
								<SelectTrigger>
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
						<div>
							<Label className="mb-1.5">
								版本 <span className="text-destructive">*</span>
							</Label>
							<Select
								value={prototypeVersion}
								onValueChange={handleVersionSelect}
								disabled={!selectedPrototype}
							>
								<SelectTrigger>
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
													<span className="text-xs text-muted-foreground">
														(v{selectedPrototype.current_version})
													</span>
												</div>
											</SelectItem>
											{selectedPrototype.versions.map((v) => (
												<SelectItem key={v.id} value={v.version}>
													<div className="flex items-center gap-2">
														<span>v{v.version}</span>
														{v.change_summary && (
															<span className="text-xs text-muted-foreground truncate max-w-[150px]">
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
						<p className="text-xs text-muted-foreground -mt-2">
							{selectedPrototype.description}
						</p>
					)}

					{/* Name & Model in 2-column grid */}
					<div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
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
								<p className="text-xs text-destructive mt-1">
									{errors.name.message}
								</p>
							)}
						</div>
						<div>
							<Label htmlFor="model" className="mb-1.5">
								模型 <span className="text-destructive">*</span>
							</Label>
							<Select
								value={watch("model")}
								onValueChange={(v) => setValue("model", v)}
							>
								<SelectTrigger>
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
								<p className="text-xs text-muted-foreground mt-1">
									原型默认: {selectedPrototype.model}
								</p>
							)}
							{errors.model && (
								<p className="text-xs text-destructive mt-1">
									{errors.model.message}
								</p>
							)}
						</div>
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
							<p className="text-xs text-destructive mt-1">
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
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{mockSkills.map((skill) => (
							<SkillBadge
								key={skill.id}
								skill={skill}
								isSelected={selectedSkillIds.has(skill.id)}
								onClick={() => toggleSkill(skill)}
							/>
						))}
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						已选择 {selectedSkills.length} 个技能
					</p>
				</CardContent>
			</Card>

			{/* Advanced Config Card */}
			<Card>
				<CardHeader>
					<Button
						type="button"
						variant="ghost"
						className="w-full justify-start h-auto p-0"
						onClick={() => setShowAdvanced((v) => !v)}
					>
						<HugeiconsIcon
							icon={Settings02Icon}
							strokeWidth={1.5}
							className="size-4 mr-2"
						/>
						<CardTitle className="text-sm">高级配置</CardTitle>
					</Button>
				</CardHeader>
				{showAdvanced && (
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-x-6 gap-y-4">
							{/* Temperature */}
							<div>
								<Label htmlFor="temperature" className="mb-1.5">
									温度
								</Label>
								<Input
									id="temperature"
									type="number"
									step={0.1}
									min={0}
									max={2}
									value={advancedConfig.temperature}
									onChange={(e) =>
										setAdvancedConfig((p) => ({
											...p,
											temperature: parseFloat(e.target.value),
										}))
									}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									0=确定, 1=随机, 2=高度随机
								</p>
							</div>
							{/* Max Tokens */}
							<div>
								<Label htmlFor="maxTokens" className="mb-1.5">
									最大 Tokens
								</Label>
								<Input
									id="maxTokens"
									type="number"
									min={100}
									max={32000}
									value={advancedConfig.maxTokens}
									onChange={(e) =>
										setAdvancedConfig((p) => ({
											...p,
											maxTokens: parseInt(e.target.value),
										}))
									}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									单次响应的最大 token 数
								</p>
							</div>
							{/* Thinking Level */}
							<div>
								<Label htmlFor="thinking" className="mb-1.5">
									思考深度
								</Label>
								<Select
									value={advancedConfig.thinking}
									onValueChange={(v) =>
										setAdvancedConfig((p) => ({
											...p,
											thinking: v as typeof p.thinking,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{thinkingOptions.map((o) => (
											<SelectItem key={o.value} value={o.value}>
												{o.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{/* Timeout */}
							<div>
								<Label htmlFor="timeout" className="mb-1.5">
									超时时间（秒）
								</Label>
								<Input
									id="timeout"
									type="number"
									min={5}
									max={300}
									value={advancedConfig.timeout}
									onChange={(e) =>
										setAdvancedConfig((p) => ({
											...p,
											timeout: parseInt(e.target.value),
										}))
									}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									单次执行的最大等待时间
								</p>
							</div>
							{/* Retry Attempts */}
							<div>
								<Label htmlFor="retryAttempts" className="mb-1.5">
									最大重试次数
								</Label>
								<Input
									id="retryAttempts"
									type="number"
									min={0}
									max={10}
									value={advancedConfig.retryAttempts}
									onChange={(e) =>
										setAdvancedConfig((p) => ({
											...p,
											retryAttempts: parseInt(e.target.value),
										}))
									}
								/>
							</div>
							{/* Retry Backoff */}
							<div>
								<Label htmlFor="retryBackoff" className="mb-1.5">
									重试策略
								</Label>
								<Select
									value={advancedConfig.retryBackoff}
									onValueChange={(v) =>
										setAdvancedConfig((p) => ({
											...p,
											retryBackoff: v as typeof p.retryBackoff,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="linear">线性退避</SelectItem>
										<SelectItem value="exponential">指数退避</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Actions */}
			<div className="flex items-center justify-end gap-2">
				<Button variant="outline" type="button" asChild>
					<Link href={`/workspace/${workspaceCode}/agents`}>取消</Link>
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					创建 Agent
				</Button>
			</div>
		</form>
	);
}
