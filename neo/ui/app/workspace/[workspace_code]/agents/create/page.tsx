"use client";

import { useState } from "react";
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
	model: z.string().min(1, "请选择模型"),
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

/**
 * Agent Factory Create Page
 *
 * 路由: /workspace/{workspace_code}/agents/create
 * 角色: Workspace 成员
 * 功能: 基于 Prototype 创建新的 Agent 实例
 */
export default function AgentFactoryCreatePage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;

	const [selectedPrototype, setSelectedPrototype] =
		useState<SelectablePrototype | null>(null);
	const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
	const [showAdvanced, setShowAdvanced] = useState(false);

	// Advanced config state
	const [temperature, setTemperature] = useState(0.7);
	const [maxTokens, setMaxTokens] = useState(4096);
	const [thinking, setThinking] = useState<"low" | "medium" | "high">("medium");
	const [timeout, setTimeout] = useState(60);
	const [retryAttempts, setRetryAttempts] = useState(3);
	const [retryBackoff, setRetryBackoff] = useState<"linear" | "exponential">(
		"exponential",
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
			model: "",
		},
	});

	// Mock data - 可选的 Prototype 列表（仅 enabled 状态）
	const mockPrototypes: SelectablePrototype[] = [
		{
			id: 1,
			code: "customer-service-pro",
			name: "客服助手 Pro",
			description: "高级客服Agent，支持多轮对话和工单创建",
			version: "1.2.0",
			model: "gpt-4o",
		},
		{
			id: 2,
			code: "sales-assistant",
			name: "销售助手",
			description: "辅助销售团队进行客户跟进和报价生成",
			version: "1.0.0",
			model: "gpt-4o-mini",
		},
	];

	// Mock data - 可选的技能列表
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
	];

	const thinkingOptions = [
		{ value: "low", label: "低 - 快速响应，简单任务" },
		{ value: "medium", label: "中 - 平衡速度与质量" },
		{ value: "high", label: "高 - 深度思考，复杂推理" },
	];

	const handlePrototypeSelect = (prototypeId: string) => {
		const prototype = mockPrototypes.find(
			(p) => p.id === parseInt(prototypeId),
		);
		if (prototype) {
			setSelectedPrototype(prototype);
			setValue("prototype_id", prototype.id);
			setValue("model", prototype.model);
		}
	};

	const toggleSkill = (skill: Skill) => {
		setSelectedSkills((prev) =>
			prev.some((s) => s.id === skill.id)
				? prev.filter((s) => s.id !== skill.id)
				: [...prev, skill],
		);
	};

	const onSubmit = async (data: CreateAgentForm) => {
		// TODO: 调用 API 创建 Agent
		console.log("创建 Agent:", {
			...data,
			skills: selectedSkills.map((s) => s.id),
			config: {
				temperature,
				max_tokens: maxTokens,
				thinking,
				timeout,
				retry: { max_attempts: retryAttempts, backoff: retryBackoff },
			},
		});
		// 模拟提交后跳转
		router.push(`/workspace/${workspaceCode}/agents`);
	};

	const prototypeId = watch("prototype_id");

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
				<CardContent className="space-y-4">
					{/* Prototype Selection */}
					<div className="space-y-2">
						<Label htmlFor="prototype">
							选择原型 <span className="text-destructive">*</span>
						</Label>
						<Select
							value={prototypeId > 0 ? prototypeId.toString() : ""}
							onValueChange={handlePrototypeSelect}
						>
							<SelectTrigger>
								<SelectValue placeholder="请选择 Agent 原型..." />
							</SelectTrigger>
							<SelectContent>
								{mockPrototypes.map((prototype) => (
									<SelectItem
										key={prototype.id}
										value={prototype.id.toString()}
									>
										<div className="flex items-center gap-2">
											<span>{prototype.name}</span>
											<span className="text-xs text-muted-foreground">
												v{prototype.version}
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedPrototype?.description && (
							<p className="text-xs text-muted-foreground mt-1">
								{selectedPrototype.description}
							</p>
						)}
					</div>

					{/* Name */}
					<div className="space-y-2">
						<Label htmlFor="name">
							Agent 名称 <span className="text-destructive">*</span>
						</Label>
						<Input
							id="name"
							placeholder="输入 Agent 名称"
							{...register("name")}
						/>
						{errors.name && (
							<p className="text-xs text-destructive">{errors.name.message}</p>
						)}
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description">描述</Label>
						<Textarea
							id="description"
							placeholder="输入 Agent 描述（可选）"
							rows={3}
							{...register("description")}
						/>
						{errors.description && (
							<p className="text-xs text-destructive">
								{errors.description.message}
							</p>
						)}
					</div>

					{/* Model */}
					<div className="space-y-2">
						<Label htmlFor="model">
							模型 <span className="text-destructive">*</span>
						</Label>
						<Select
							value={watch("model")}
							onValueChange={(value) => setValue("model", value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="请选择模型..." />
							</SelectTrigger>
							<SelectContent>
								{models.map((model) => (
									<SelectItem key={model.value} value={model.value}>
										{model.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedPrototype && (
							<p className="text-xs text-muted-foreground mt-1">
								原型默认模型: {selectedPrototype.model}
							</p>
						)}
						{errors.model && (
							<p className="text-xs text-destructive">{errors.model.message}</p>
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
						{mockSkills.map((skill) => {
							const isSelected = selectedSkills.some((s) => s.id === skill.id);
							return (
								<Badge
									key={skill.id}
									variant={isSelected ? "default" : "outline"}
									className="cursor-pointer"
									onClick={() => toggleSkill(skill)}
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
						})}
					</div>
					<p className="text-xs text-muted-foreground mt-3">
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
						onClick={() => setShowAdvanced(!showAdvanced)}
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
						<div className="grid grid-cols-2 gap-4">
							{/* Temperature */}
							<div className="space-y-2">
								<Label htmlFor="temperature">温度</Label>
								<Input
									id="temperature"
									type="number"
									step={0.1}
									min={0}
									max={2}
									value={temperature}
									onChange={(e) => setTemperature(parseFloat(e.target.value))}
								/>
								<p className="text-xs text-muted-foreground">
									0=确定输出, 1=随机输出, 2=高度随机
								</p>
							</div>

							{/* Max Tokens */}
							<div className="space-y-2">
								<Label htmlFor="maxTokens">最大 Tokens</Label>
								<Input
									id="maxTokens"
									type="number"
									min={100}
									max={32000}
									value={maxTokens}
									onChange={(e) => setMaxTokens(parseInt(e.target.value))}
								/>
								<p className="text-xs text-muted-foreground">
									单次响应的最大 token 数
								</p>
							</div>

							{/* Thinking Level */}
							<div className="space-y-2">
								<Label htmlFor="thinking">思考深度</Label>
								<Select
									value={thinking}
									onValueChange={(v) => setThinking(v as typeof thinking)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{thinkingOptions.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Timeout */}
							<div className="space-y-2">
								<Label htmlFor="timeout">超时时间（秒）</Label>
								<Input
									id="timeout"
									type="number"
									min={5}
									max={300}
									value={timeout}
									onChange={(e) => setTimeout(parseInt(e.target.value))}
								/>
								<p className="text-xs text-muted-foreground">
									单次执行的最大等待时间
								</p>
							</div>

							{/* Retry Attempts */}
							<div className="space-y-2">
								<Label htmlFor="retryAttempts">最大重试次数</Label>
								<Input
									id="retryAttempts"
									type="number"
									min={0}
									max={10}
									value={retryAttempts}
									onChange={(e) => setRetryAttempts(parseInt(e.target.value))}
								/>
							</div>

							{/* Retry Backoff */}
							<div className="space-y-2">
								<Label htmlFor="retryBackoff">重试策略</Label>
								<Select
									value={retryBackoff}
									onValueChange={(v) =>
										setRetryBackoff(v as typeof retryBackoff)
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
