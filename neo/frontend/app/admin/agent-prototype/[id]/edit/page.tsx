"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { EnhancedTabs } from "@/components/agent-prototype/enhanced-tabs";
import { MarkdownEditor } from "@/components/agent-prototype/markdown-editor";

export default function AgentPrototypeEditPage() {
	const params = useParams();
	const prototypeId = params.id as string;

	const [saving, setSaving] = useState(false);

	// Form state
	const [name, setName] = useState("客服助手 Pro");
	const [code, setCode] = useState("customer-service-pro");
	const [description, setDescription] = useState(
		"高级客服Agent，支持多轮对话和工单创建",
	);
	const [model, setModel] = useState("gpt-4o");
	const [temperature, setTemperature] = useState("0.7");
	const [maxTokens, setMaxTokens] = useState("4096");

	// Prompts 配置
	const [activeTab, setActiveTab] = useState("soul");
	const [prompts, setPrompts] = useState({
		soul: "你是一个专业的客服助手，名为小美。你需要：\n1. 礼貌问候客户\n2. 理解客户问题\n3. 提供准确解答或转接人工\n\n语气：亲切、专业、有耐心",
		memory:
			"## 记忆机制\n\n### 用户信息记忆\n- 记住用户的基本信息（姓名、偏好）\n- 记录历史对话中的关键信息\n\n### 上下文理解\n- 理解对话的上下文和意图\n- 保持对话的连贯性",
		reasoning:
			"## 推理方式\n\n### 问题分析\n1. 首先理解用户的问题\n2. 分析问题的类型和紧急程度\n3. 搜索相关知识库\n\n### 解决方案生成\n- 提供清晰、可执行的建议\n- 必要时转接人工",
		agents:
			"## 多智能体协作\n\n### 角色分工\n- **主 Agent**：处理用户请求\n- **知识库 Agent**：提供信息检索\n- **工单 Agent**：创建和管理工单",
		workflow:
			"## 工作流程\n\n### 标准流程\n1. 问候并了解问题\n2. 分析问题类型\n3. 提供解决方案或转接\n4. 记录工单（如需要）\n5. 跟进满意度",
		communication:
			"## 沟通规范\n\n### 语气要求\n- 亲切、友好、专业\n- 使用简洁清晰的语言\n- 避免过于技术性的术语\n\n### 特殊情况\n- 不确定时承认并说明会查询\n- 转接时说明原因和后续跟进",
	});

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

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("请输入名称");
			return;
		}

		setSaving(true);
		setTimeout(() => {
			toast.success("保存成功");
			setSaving(false);
		}, 500);
	};

	const handleSavePrompt = async (key: string) => {
		toast.success(`${promptTypes.find((p) => p.key === key)?.label} 保存成功`);
	};

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
					<Button onClick={handleSave} disabled={saving}>
						<HugeiconsIcon
							icon={FloppyDiskIcon}
							strokeWidth={1.5}
							className="size-4 mr-1"
						/>
						{saving ? "保存中..." : "保存"}
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
								onChange={(e) => setName(e.target.value)}
								placeholder="输入 Agent 原型名称"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="code">标识符</Label>
							<Input
								id="code"
								value={code}
								onChange={(e) => setCode(e.target.value)}
								placeholder="agent-code"
								disabled
								className="font-mono"
							/>
							<p className="text-xs text-muted-foreground">
								标识符创建后不可修改
							</p>
						</div>
					</div>

					<div className="grid grid-cols-4 gap-4">
						<div className="space-y-2">
							<Label htmlFor="model">模型</Label>
							<Input
								id="model"
								value={model}
								onChange={(e) => setModel(e.target.value)}
								placeholder="gpt-4o"
								className="font-mono"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="temperature">温度</Label>
							<Input
								id="temperature"
								type="number"
								step="0.1"
								min="0"
								max="2"
								value={temperature}
								onChange={(e) => setTemperature(e.target.value)}
								className="font-mono"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="maxTokens">最大 Tokens</Label>
							<Input
								id="maxTokens"
								type="number"
								min="1"
								value={maxTokens}
								onChange={(e) => setMaxTokens(e.target.value)}
								className="font-mono"
							/>
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
					</div>
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
