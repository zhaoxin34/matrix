"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowLeft01Icon,
	FloppyDiskIcon,
	EyeIcon,
} from "@hugeicons/core-free-icons";
import type { PromptConfig } from "@/components/agent-prototype/agent-prototype-types";

export default function AgentPrototypeEditPage() {
	const params = useParams();
	const prototypeId = params.id as string;

	const [saving, setSaving] = useState(false);
	const [previewMode, setPreviewMode] = useState(false);

	// Form state - 使用 mock 数据初始化
	const [name, setName] = useState("客服助手 Pro");
	const [code, setCode] = useState("customer-service-pro");
	const [description, setDescription] = useState(
		"高级客服Agent，支持多轮对话和工单创建",
	);
	const [model, setModel] = useState("gpt-4o");
	const [prompts, setPrompts] = useState<PromptConfig>({
		system:
			"你是一个专业的客服助手，名为小美。你需要：\n1. 礼貌问候客户\n2. 理解客户问题\n3. 提供准确解答或转接人工\n\n语气：亲切、专业、有耐心",
		user: "当用户询问产品时，你应该：\n1. 先了解用户的需求\n2. 推荐合适的产品\n3. 提供价格和功能对比",
		tool: "你可以使用以下工具：\n- search_knowledge: 搜索知识库\n- create_ticket: 创建工单\n- transfer_human: 转接人工",
	});

	const handlePromptChange = (type: string, value: string) => {
		setPrompts((prev) => ({ ...prev, [type]: value }));
	};

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("请输入名称");
			return;
		}

		setSaving(true);
		// 模拟保存成功（后端未实现时使用 mock）
		setTimeout(() => {
			toast.success("保存成功");
			setSaving(false);
		}, 500);
	};

	const promptTypes = [
		{ key: "system", label: "System", description: "定义 Agent 的角色和行为" },
		{ key: "user", label: "User", description: "用户场景提示词" },
		{ key: "tool", label: "Tool", description: "工具使用说明" },
	];

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
						<h1 className="text-xl font-heading font-medium">
							编辑 Agent 原型
						</h1>
						<p className="text-xs text-muted-foreground mt-1">{name}</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => setPreviewMode(!previewMode)}
					>
						<HugeiconsIcon
							icon={EyeIcon}
							strokeWidth={1.5}
							className="size-4 mr-1"
						/>
						{previewMode ? "编辑模式" : "预览模式"}
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						<HugeiconsIcon
							icon={FloppyDiskIcon}
							strokeWidth={1.5}
							className="size-4 mr-1"
						/>
						{saving ? "保存中..." : "保存草稿"}
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
								disabled={previewMode}
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

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="description">描述</Label>
							<Input
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="描述该 Agent 原型的用途"
								disabled={previewMode}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="model">模型</Label>
							<Input
								id="model"
								value={model}
								onChange={(e) => setModel(e.target.value)}
								placeholder="gpt-4o"
								disabled={previewMode}
								className="font-mono"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Prompts Editor Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">提示词配置</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="system" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							{promptTypes.map((type) => (
								<TabsTrigger key={type.key} value={type.key}>
									{type.label}
								</TabsTrigger>
							))}
						</TabsList>

						{promptTypes.map((type) => (
							<TabsContent key={type.key} value={type.key} className="mt-4">
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<p className="text-xs text-muted-foreground">
											{type.description}
										</p>
										<span className="text-xs text-muted-foreground font-mono">
											{(prompts[type.key] || "").length} 字符
										</span>
									</div>
									<textarea
										value={prompts[type.key] || ""}
										onChange={(e) =>
											handlePromptChange(type.key, e.target.value)
										}
										placeholder={`输入 ${type.label} 提示词...`}
										disabled={previewMode}
										className="w-full min-h-[300px] p-4 text-sm bg-background border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
									/>
								</div>
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

			{/* Preview Card (when in preview mode) */}
			{previewMode && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">完整预览</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground uppercase">
								System Prompt
							</p>
							<pre className="text-xs bg-muted p-4 rounded-md whitespace-pre-wrap">
								{prompts.system || "(空)"}
							</pre>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground uppercase">
								User Prompt
							</p>
							<pre className="text-xs bg-muted p-4 rounded-md whitespace-pre-wrap">
								{prompts.user || "(空)"}
							</pre>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground uppercase">
								Tool Prompt
							</p>
							<pre className="text-xs bg-muted p-4 rounded-md whitespace-pre-wrap">
								{prompts.tool || "(空)"}
							</pre>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
