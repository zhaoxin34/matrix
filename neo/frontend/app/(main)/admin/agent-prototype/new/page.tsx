"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { EnhancedTabs } from "@/components/agent-prototype/enhanced-tabs";
import { MarkdownEditor } from "@/components/agent-prototype/markdown-editor";
import { ModelProviderSelector } from "@/components/agent-prototype/model-provider-selector";
import { createAgentPrototype } from "@/lib/api/agent-prototype";

export default function NewAgentPrototypePage() {
	const router = useRouter();
	const [saving, setSaving] = useState(false);

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
	const [prompts, setPrompts] = useState({
		soul: "",
		memory: "",
		reasoning: "",
		agents: "",
		workflow: "",
		communication: "",
	});

	// Auto-generate code from name
	const handleNameChange = (value: string) => {
		setName(value);
		const generatedCode = value
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");
		setCode(generatedCode);
	};

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

	const handlePromptChange = (key: string, value: string) => {
		setPrompts((prev) => ({ ...prev, [key]: value }));
	};

	const handleSavePrompt = async (key: string) => {
		toast.success(`${promptTypes.find((p) => p.key === key)?.label} 保存成功`);
	};

	const handleSubmit = async () => {
		if (!name.trim()) {
			toast.error("请输入名称");
			return;
		}

		if (!code.trim()) {
			toast.error("请输入标识符");
			return;
		}

		setSaving(true);
		try {
			const promptsConfig: Record<string, string> = {};
			for (const [key, value] of Object.entries(prompts)) {
				if (value.trim()) {
					promptsConfig[key] = value;
				}
			}

			const requestData: Parameters<typeof createAgentPrototype>[0] = {
				name: name.trim(),
				code: code.trim(),
				description: description.trim() || undefined,
				prompts:
					Object.keys(promptsConfig).length > 0 ? promptsConfig : undefined,
			};

			// Add model configuration
			if (modelSelection.providerId && modelSelection.modelId) {
				requestData.provider_id = modelSelection.providerId;
				requestData.model_id = modelSelection.modelId;
				requestData.llm_config = {
					temperature: modelSelection.temperature,
					max_tokens: modelSelection.maxTokens,
				};
				requestData.model = modelSelection.modelId; // Legacy field
			} else {
				// Fallback to default model
				requestData.model = "gpt-4o";
			}

			await createAgentPrototype(requestData);

			toast.success("创建成功");
			router.push("/admin/agent-prototype");
		} catch (error) {
			console.error("Failed to create prototype:", error);
			toast.error("创建失败，请重试");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
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
						<h1 className="text-xl font-heading font-medium">新建原型</h1>
						<p className="text-xs text-muted-foreground mt-1">
							创建一个新的 Agent 原型模板
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" asChild>
						<Link href="/admin/agent-prototype">取消</Link>
					</Button>
					<Button onClick={handleSubmit} disabled={saving}>
						{saving ? "创建中..." : "创建"}
					</Button>
				</div>
			</div>

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
								onChange={(e) => handleNameChange(e.target.value)}
								placeholder="输入 Agent 原型名称"
							/>
							<p className="text-xs text-muted-foreground">
								例如：客服助手 Pro
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="code">
								标识符 <span className="text-destructive">*</span>
							</Label>
							<Input
								id="code"
								value={code}
								onChange={(e) => setCode(e.target.value)}
								placeholder="agent-code"
								className="font-mono"
							/>
							<p className="text-xs text-muted-foreground">
								唯一的英文标识符，创建后不可修改
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
						/>
					</div>
				</CardContent>
			</Card>

			{/* Model Selection Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">模型配置</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<ModelProviderSelector
						value={modelSelection}
						onChange={setModelSelection}
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
									{(prompts[activeTab as keyof typeof prompts] || "").length}{" "}
									字符
								</span>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleSavePrompt(activeTab)}
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
								value={prompts[activeTab as keyof typeof prompts]}
								onChange={(val) => handlePromptChange(activeTab, val)}
								placeholder={`输入 ${promptTypes.find((t) => t.key === activeTab)?.label} 提示词...`}
								minHeight={400}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
