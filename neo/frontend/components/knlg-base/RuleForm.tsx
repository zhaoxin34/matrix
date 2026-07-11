"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
	SearchableSelect,
	type SelectOption,
} from "@/components/knlg-base/SearchableSelect";
import {
	getKnowledgeCard,
	listKnowledgeCards,
} from "@/lib/api/knlg-base/knowledge";
import type { Rule } from "@/lib/api/knlg-base/_base";

interface ConditionItem {
	field: string;
	operator: string;
	value: string;
}

interface TriggerConfig {
	type: string;
	event_name: string;
}

interface RuleFormProps {
	/** 工作空间代码，用于加载知识卡片列表 */
	workspaceCode: string;
	initialData?: Partial<Rule>;
	onSubmit: (data: RuleFormData) => Promise<void>;
	submitLabel: string;
	loading?: boolean;
}

export interface RuleFormData {
	name: string;
	description: string;
	source_kc_id: number;
	trigger: TriggerConfig;
	conditions: ConditionItem[];
	conclusion: { message: string };
	confidence: number;
}

export function RuleForm({
	workspaceCode,
	initialData,
	onSubmit,
	submitLabel,
	loading = false,
}: RuleFormProps) {
	// 基础字段
	const [name, setName] = useState(initialData?.name || "");
	const [description, setDescription] = useState(
		initialData?.description || "",
	);
	const [sourceKcId, setSourceKcId] = useState<string | null>(
		initialData?.source_kc_id?.toString() || null,
	);
	const [confidence, setConfidence] = useState(
		initialData?.confidence?.toString() || "0.5",
	);

	// 触发器
	const [triggerType, setTriggerType] = useState(
		(initialData?.trigger?.type as string) || "event_subscription",
	);
	const [eventName, setEventName] = useState(
		(initialData?.trigger?.event_name as string) || "",
	);

	// 条件
	const [conditions, setConditions] = useState<ConditionItem[]>(() => {
		if (initialData?.conditions && initialData.conditions.length > 0) {
			return initialData.conditions.map((c) => ({
				field: (c.field as string) || "",
				operator: (c.operator as string) || "",
				value: (c.value as string) || "",
			}));
		}
		return [];
	});

	// 结论
	const [conclusionMessage, setConclusionMessage] = useState(
		(initialData?.conclusion?.message as string) || "",
	);

	// 展开状态
	const [triggerExpanded, setTriggerExpanded] = useState(true);
	const [conditionsExpanded, setConditionsExpanded] = useState(true);
	const [conclusionExpanded, setConclusionExpanded] = useState(true);

	// 错误提示
	const [error, setError] = useState("");

	// 加载知识卡片选项
	const loadKnowledgeCardOptions = async (
		search: string,
		page: number,
	): Promise<{ items: SelectOption[]; hasMore: boolean }> => {
		const pageSize = 20;
		const result = await listKnowledgeCards(workspaceCode, {
			page,
			page_size: pageSize,
			keyword: search || undefined,
		});

		const items: SelectOption[] = result.items.map((kc) => ({
			value: kc.id.toString(),
			label: kc.title || `知识卡片 #${kc.id}`,
			description: kc.statement?.slice(0, 50) || undefined,
		}));

		return {
			items,
			hasMore: page < result.total_pages,
		};
	};

	// 根据 ID 获取单个知识卡片选项（用于初始化时显示选中项的标签）
	const getKnowledgeCardOptionByValue = async (
		value: string,
	): Promise<SelectOption | null> => {
		try {
			const kc = await getKnowledgeCard(workspaceCode, parseInt(value));
			return {
				value: kc.id.toString(),
				label: kc.title || `知识卡片 #${kc.id}`,
				description: kc.statement?.slice(0, 50) || undefined,
			};
		} catch (error) {
			console.error("Failed to load knowledge card:", error);
			return null;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		try {
			await onSubmit({
				name,
				description,
				source_kc_id: sourceKcId ? parseInt(sourceKcId) : 0,
				trigger: {
					type: triggerType,
					event_name: eventName,
				},
				conditions,
				conclusion: { message: conclusionMessage },
				confidence: parseFloat(confidence) || 0.5,
			});
		} catch (err: unknown) {
			const e = err as { message?: string };
			setError(e.message || "操作失败");
		}
	};

	// 条件操作
	const addCondition = () => {
		setConditions([...conditions, { field: "", operator: "", value: "" }]);
	};

	const removeCondition = (index: number) => {
		setConditions(conditions.filter((_, i) => i !== index));
	};

	const updateCondition = (
		index: number,
		field: keyof ConditionItem,
		value: string,
	) => {
		const updated = [...conditions];
		updated[index] = { ...updated[index], [field]: value };
		setConditions(updated);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* 基础信息 */}
			<Card>
				<CardHeader>
					<CardTitle>基本信息</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="name" className="mb-1.5">
							名称 *
						</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							maxLength={255}
							placeholder="规则名称"
						/>
					</div>

					<div>
						<Label htmlFor="description" className="mb-1.5">
							说明
						</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
							placeholder="规则的详细说明"
						/>
					</div>

					<div>
						<Label className="mb-1.5">来源知识卡片</Label>
						<SearchableSelect
							value={sourceKcId}
							onChange={(value) => setSourceKcId(value)}
							loadOptions={loadKnowledgeCardOptions}
							getOptionByValue={getKnowledgeCardOptionByValue}
							placeholder="搜索并选择知识卡片..."
							minSearchLength={0}
							debounceMs={300}
						/>
						<p className="text-xs text-muted-foreground mt-1">
							选择此规则关联的知识卡片，留空表示不关联
						</p>
					</div>

					<div>
						<Label htmlFor="confidence" className="mb-1.5">
							置信度 (0-1)
						</Label>
						<Input
							id="confidence"
							type="number"
							min="0"
							max="1"
							step="0.05"
							value={confidence}
							onChange={(e) => setConfidence(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* 触发器 */}
			<Card>
				<CardHeader>
					<button
						type="button"
						onClick={() => setTriggerExpanded(!triggerExpanded)}
						className="flex items-center gap-2 w-full text-left"
					>
						{triggerExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
						<CardTitle>触发器</CardTitle>
					</button>
				</CardHeader>
				{triggerExpanded && (
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							定义触发规则的事件条件
						</p>

						<div>
							<Label htmlFor="trigger_type" className="mb-1.5">
								触发类型
							</Label>
							<Input
								id="trigger_type"
								value={triggerType}
								onChange={(e) => setTriggerType(e.target.value)}
								placeholder="event_subscription"
							/>
						</div>

						<div>
							<Label htmlFor="event_name" className="mb-1.5">
								事件名称
							</Label>
							<Input
								id="event_name"
								value={eventName}
								onChange={(e) => setEventName(e.target.value)}
								placeholder="opportunity.stage_changed"
							/>
						</div>
					</CardContent>
				)}
			</Card>

			{/* 条件 */}
			<Card>
				<CardHeader>
					<button
						type="button"
						onClick={() => setConditionsExpanded(!conditionsExpanded)}
						className="flex items-center gap-2 w-full text-left"
					>
						{conditionsExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
						<CardTitle>条件</CardTitle>
					</button>
				</CardHeader>
				{conditionsExpanded && (
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							定义规则执行的前置条件（可选）
						</p>

						{conditions.length === 0 ? (
							<p className="text-sm text-muted-foreground py-2">
								暂无条件，点击下方按钮添加
							</p>
						) : (
							<div className="space-y-3">
								{conditions.map((condition, index) => (
									<div
										key={index}
										className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
									>
										<div className="flex-1 grid grid-cols-3 gap-2">
											<div>
												<Label className="text-xs mb-1">字段</Label>
												<Input
													value={condition.field}
													onChange={(e) =>
														updateCondition(index, "field", e.target.value)
													}
													placeholder="field"
												/>
											</div>
											<div>
												<Label className="text-xs mb-1">操作符</Label>
												<Input
													value={condition.operator}
													onChange={(e) =>
														updateCondition(index, "operator", e.target.value)
													}
													placeholder="eq, gt, lt..."
												/>
											</div>
											<div>
												<Label className="text-xs mb-1">值</Label>
												<Input
													value={condition.value}
													onChange={(e) =>
														updateCondition(index, "value", e.target.value)
													}
													placeholder="value"
												/>
											</div>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => removeCondition(index)}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}

						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addCondition}
						>
							<Plus className="h-4 w-4 mr-1" />
							添加条件
						</Button>
					</CardContent>
				)}
			</Card>

			{/* 结论 */}
			<Card>
				<CardHeader>
					<button
						type="button"
						onClick={() => setConclusionExpanded(!conclusionExpanded)}
						className="flex items-center gap-2 w-full text-left"
					>
						{conclusionExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
						<CardTitle>结论</CardTitle>
					</button>
				</CardHeader>
				{conclusionExpanded && (
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							定义规则匹配后执行的动作或返回的消息
						</p>

						<div>
							<Label htmlFor="conclusion_message" className="mb-1.5">
								结论消息
							</Label>
							<Textarea
								id="conclusion_message"
								value={conclusionMessage}
								onChange={(e) => setConclusionMessage(e.target.value)}
								rows={3}
								placeholder="客户需要尽快跟进，请联系销售负责人"
							/>
						</div>
					</CardContent>
				)}
			</Card>

			{/* 错误提示和提交 */}
			{error && <p className="text-red-600 text-sm">{error}</p>}

			<div className="flex gap-2">
				<Button type="submit" disabled={loading}>
					{loading ? "处理中..." : submitLabel}
				</Button>
			</div>
		</form>
	);
}
