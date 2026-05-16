"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export default function NewAgentPrototypePage() {
	const [saving, setSaving] = useState(false);

	// Form state
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [description, setDescription] = useState("");
	const [model, setModel] = useState("gpt-4o");

	// Auto-generate code from name
	const handleNameChange = (value: string) => {
		setName(value);
		// Generate code: lowercase, replace spaces with hyphens, remove special chars
		const generatedCode = value
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");
		setCode(generatedCode);
	};

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("请输入名称");
			return;
		}

		if (!code.trim()) {
			toast.error("请输入标识符");
			return;
		}

		setSaving(true);
		// 模拟创建成功（后端未实现时使用 mock）
		setTimeout(() => {
			toast.success("创建成功");
			setSaving(false);
		}, 500);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
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
					<h1 className="text-xl font-heading font-medium">新建 Agent 原型</h1>
					<p className="text-xs text-muted-foreground mt-1">
						创建一个新的 Agent 原型模板
					</p>
				</div>
			</div>

			{/* Form Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">基本信息</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
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

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="description">描述</Label>
							<Input
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="描述该 Agent 原型的用途"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="model">模型</Label>
							<Input
								id="model"
								value={model}
								onChange={(e) => setModel(e.target.value)}
								placeholder="gpt-4o"
								className="font-mono"
							/>
							<p className="text-xs text-muted-foreground">
								使用的 AI 模型，如 gpt-4o、gpt-4o-mini
							</p>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-2 pt-4 border-t">
						<Button variant="outline" asChild>
							<Link href="/admin/agent-prototype">取消</Link>
						</Button>
						<Button onClick={handleSave} disabled={saving}>
							{saving ? "创建中..." : "创建并编辑"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Tips Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">创建提示</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-2 text-sm text-muted-foreground">
						<li className="flex items-start gap-2">
							<span className="text-primary">•</span>
							创建后，原型初始状态为草稿（draft）
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary">•</span>
							在编辑页面配置提示词后，需要发布才能启用
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary">•</span>
							支持版本管理，可以回滚到历史版本
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
