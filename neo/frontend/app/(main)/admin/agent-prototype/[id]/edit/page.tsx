"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { EnhancedTabs } from "@/components/agent-prototype/enhanced-tabs";
import { MarkdownEditor } from "@/components/agent-prototype/markdown-editor";
import { ModelProviderSelector } from "@/components/agent-prototype/model-provider-selector";
import {
	getAgentPrototype,
	updateAgentPrototype,
	ApiError,
} from "@/lib/api/agent-prototype";
import type { AgentPrototypeResponse } from "@/lib/api/agent-prototype";

const promptTypes = [
	{
		key: "soul",
		label: "SOUL",
		desc: "核心灵魂：定义 Agent 的基本性格、价值观和行为准则",
	},
	{
		key: "memory",
		label: "MEMORY",
		desc: "记忆机制：定义 Agent 如何存储和检索过往经验",
	},
	{
		key: "reasoning",
		label: "REASONING",
		desc: "推理方式：定义 Agent 的思考链和问题解决模式",
	},
	{
		key: "agents",
		label: "AGENTS",
		desc: "多智能体：定义多 Agent 协作时的角色分工",
	},
	{
		key: "workflow",
		label: "WORKFLOW",
		desc: "工作流程：定义任务执行的标准流程和步骤",
	},
	{
		key: "communication",
		label: "COMMUNICATION",
		desc: "沟通方式：定义 Agent 与用户/其他 Agent 交互规范",
	},
];

export default function AgentPrototypeEditPage() {
	const params = useParams();
	const router = useRouter();
	const prototypeId = params.id as string;

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [prototype, setPrototype] = useState<AgentPrototypeResponse | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [description, setDescription] = useState("");

	// Model provider state
	const [modelSelection, setModelSelection] = useState<{
		providerId?: number;
		modelId?: string;
		temperature?: number;
		maxTokens?: number;
	}>({
		temperature: 0.7,
		maxTokens: 4096,
	});

	// Prompts 配置
	const [activeTab, setActiveTab] = useState("soul");
	const [prompts, setPrompts] = useState<Record<string, string>>({
		soul: "",
		memory: "",
		reasoning: "",
		agents: "",
		workflow: "",
		communication: "",
	});

	const fetchPrototype = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await getAgentPrototype(parseInt(prototypeId, 10));
			setPrototype(data);

			// Populate form with fetched data
			setName(data.name);
			setCode(data.code);
			setDescription(data.description || "");

			// Model provider state
			const llmConfig: Record<string, unknown> = data.llm_config || {};
			setModelSelection({
				providerId: data.provider_id ?? undefined,
				modelId: data.model_id ?? undefined,
				temperature:
					typeof llmConfig.temperature === "number"
						? llmConfig.temperature
						: 0.7,
				maxTokens:
					typeof llmConfig.max_tokens === "number"
						? llmConfig.max_tokens
						: 4096,
			});

			// Parse prompts
			const fetchedPrompts = data.prompts || {};
			setPrompts({
				soul: fetchedPrompts.soul || "",
				memory: fetchedPrompts.memory || "",
				reasoning: fetchedPrompts.reasoning || "",
				agents: fetchedPrompts.agents || "",
				workflow: fetchedPrompts.workflow || "",
				communication: fetchedPrompts.communication || "",
			});
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
			} else {
				setError("获取数据失败");
			}
			console.error("Failed to fetch prototype:", err);
		} finally {
			setLoading(false);
		}
	}, [prototypeId]);

	useEffect(() => {
		requestAnimationFrame(() => {
			fetchPrototype();
		});
	}, [fetchPrototype]);

	const handlePromptChange = (key: string, value: string) => {
		setPrompts((prev) => ({ ...prev, [key]: value }));
	};

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("请输入名称");
			return;
		}

		if (!prototype) {
			toast.error("原型数据加载失败");
			return;
		}

		setSaving(true);
		try {
			// Build prompts config - only include non-empty prompts
			const promptsConfig: Record<string, string> = {};
			for (const [key, value] of Object.entries(prompts)) {
				if (value.trim()) {
					promptsConfig[key] = value;
				}
			}

			const result = await updateAgentPrototype(prototype.id, {
				name: name.trim(),
				description: description.trim() || undefined,
				provider_id: modelSelection.providerId,
				model_id: modelSelection.modelId,
				llm_config: {
					temperature: modelSelection.temperature ?? 0.7,
					max_tokens: modelSelection.maxTokens ?? 4096,
				},
				model: modelSelection.modelId || "gpt-4o",
				prompts: promptsConfig,
			});

			// Update local state with new status (enabled -> draft)
			if (result.status !== prototype.status) {
				setPrototype({ ...prototype, status: result.status });
				toast.success("保存成功，已切换到草稿状态，请发布后生效");
			} else {
				toast.success("保存成功");
			}

			router.push(`/admin/agent-prototype/${prototypeId}`);
		} catch (err) {
			if (err instanceof ApiError) {
				toast.error(err.message);
			} else {
				toast.error("保存失败");
			}
		} finally {
			setSaving(false);
		}
	};

	const handleSavePrompt = async (key: string) => {
		toast.success(
			`${promptTypes.find((p) => p.key === key)?.label} 已保存到 Prompts 配置`,
		);
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Skeleton className="h-9 w-9" />
						<div className="space-y-2">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-4 w-48" />
						</div>
					</div>
					<Skeleton className="h-9 w-20" />
				</div>
				<Card>
					<CardContent className="py-8">
						<div className="flex flex-col items-center justify-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
							<p className="text-sm text-muted-foreground">加载中...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !prototype) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/admin/agent-prototype">
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								strokeWidth={1.5}
								className="size-4"
							/>
						</Link>
					</Button>
					<div>
						<h1 className="text-xl font-heading font-medium">获取失败</h1>
					</div>
				</div>
				<Card className="border-red-200 bg-red-50">
					<CardContent className="py-4">
						<p className="text-sm text-red-600">{error || "未找到原型"}</p>
						<button
							onClick={fetchPrototype}
							className="text-xs text-red-500 hover:text-red-700 mt-2"
						>
							重试
						</button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Enabled prototypes can also be edited, but editing will revert to draft status
	const isEditable =
		prototype.status === "draft" || prototype.status === "enabled";

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href={`/admin/agent-prototype/${prototypeId}`}>
							<HugeiconsIcon
								icon={ArrowLeft01Icon}
								strokeWidth={1.5}
								className="size-4"
							/>
						</Link>
					</Button>
					<div>
						<h1 className="text-xl font-heading font-medium">编辑原型</h1>
						<p className="text-xs text-muted-foreground mt-1">{name}</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" asChild>
						<Link href={`/admin/agent-prototype/${prototypeId}`}>取消</Link>
					</Button>
					<Button onClick={handleSave} disabled={saving || !isEditable}>
						<HugeiconsIcon
							icon={FloppyDiskIcon}
							strokeWidth={1.5}
							className="size-4 mr-1"
						/>
						{saving ? "保存中..." : "保存"}
					</Button>
				</div>
			</div>

			{/* Edit Status Info */}
			{prototype.status === "enabled" && (
				<Card className="border-blue-200 bg-blue-50">
					<CardContent className="py-3">
						<p className="text-sm text-blue-700">
							此原型状态为已启用。编辑后将切换到草稿状态，需要重新发布才能生效。
						</p>
					</CardContent>
				</Card>
			)}

			{!isEditable && (
				<Card className="border-amber-200 bg-amber-50">
					<CardContent className="py-3">
						<p className="text-sm text-amber-700">
							此原型状态为已禁用，无法编辑。
						</p>
					</CardContent>
				</Card>
			)}

			{/* Basic Info Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">基本信息</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="name">
								名称 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="输入 Agent 原型名称"
								disabled={!isEditable}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="code">标识符</Label>
							<Input
								id="code"
								value={code}
								placeholder="agent-code"
								disabled
								className="font-mono"
							/>
							<p className="text-xs text-muted-foreground">
								标识符创建后不可修改
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">描述</Label>
						<Input
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="描述该 Agent 原型的用途"
							disabled={!isEditable}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Model Provider Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">模型配置</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<ModelProviderSelector
						value={modelSelection}
						onChange={setModelSelection}
						disabled={!isEditable}
					/>
				</CardContent>
			</Card>

			{/* Prompts Editor Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Prompts 配置</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Enhanced Tabs */}
					<EnhancedTabs
						tabs={promptTypes}
						activeTab={activeTab}
						onChange={setActiveTab}
					/>

					{/* Tab Content */}
					<div className="space-y-3">
						<p className="text-xs text-muted-foreground">
							{promptTypes.find((t) => t.key === activeTab)?.desc}
						</p>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground font-mono">
									{(prompts[activeTab] || "").length} 字符
								</span>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleSavePrompt(activeTab)}
									disabled={!isEditable}
								>
									<HugeiconsIcon
										icon={FloppyDiskIcon}
										strokeWidth={1.5}
										className="size-3 mr-1"
									/>
									保存
								</Button>
							</div>

							{/* Markdown Editor */}
							<MarkdownEditor
								value={prompts[activeTab]}
								onChange={(val) => handlePromptChange(activeTab, val)}
								placeholder={`输入 ${promptTypes.find((t) => t.key === activeTab)?.label} 提示词...`}
								minHeight={400}
								readOnly={!isEditable}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
