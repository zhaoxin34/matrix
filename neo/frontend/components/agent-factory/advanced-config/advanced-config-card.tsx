"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings02Icon } from "@hugeicons/core-free-icons";

const thinkingOptions = [
	{ value: "low", label: "低 - 快速响应" },
	{ value: "medium", label: "中 - 平衡速度与质量" },
	{ value: "high", label: "高 - 深度思考" },
] as const;

export interface AdvancedConfigState {
	temperature: number;
	maxTokens: number;
	thinking: "low" | "medium" | "high";
	timeout: number;
	retryAttempts: number;
	retryBackoff: "linear" | "exponential";
}

export interface AdvancedConfigProps {
	value: AdvancedConfigState;
	onChange: (config: AdvancedConfigState) => void;
}

export function AdvancedConfigCard({ value, onChange }: AdvancedConfigProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const updateField = <K extends keyof AdvancedConfigState>(
		field: K,
		fieldValue: AdvancedConfigState[K],
	) => {
		onChange({ ...value, [field]: fieldValue });
	};

	return (
		<Card>
			<CardHeader>
				<Button
					type="button"
					variant="ghost"
					className="w-full justify-start h-auto p-0"
					onClick={() => setIsExpanded((v) => !v)}
				>
					<HugeiconsIcon
						icon={Settings02Icon}
						strokeWidth={1.5}
						className="size-4 mr-2"
					/>
					<CardTitle className="text-sm">高级配置</CardTitle>
				</Button>
			</CardHeader>
			{isExpanded && (
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
								value={value.temperature}
								onChange={(e) =>
									updateField("temperature", parseFloat(e.target.value))
								}
							/>
							<p className="text-sm text-muted-foreground mt-1">
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
								value={value.maxTokens}
								onChange={(e) =>
									updateField("maxTokens", parseInt(e.target.value))
								}
							/>
							<p className="text-sm text-muted-foreground mt-1">
								单次响应的最大 token 数
							</p>
						</div>
						{/* Thinking Level */}
						<div>
							<Label htmlFor="thinking" className="mb-1.5">
								思考深度
							</Label>
							<Select
								value={value.thinking}
								onValueChange={(v) =>
									updateField("thinking", v as AdvancedConfigState["thinking"])
								}
							>
								<SelectTrigger className="w-full">
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
								value={value.timeout}
								onChange={(e) =>
									updateField("timeout", parseInt(e.target.value))
								}
							/>
							<p className="text-sm text-muted-foreground mt-1">
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
								value={value.retryAttempts}
								onChange={(e) =>
									updateField("retryAttempts", parseInt(e.target.value))
								}
							/>
						</div>
						{/* Retry Backoff */}
						<div>
							<Label htmlFor="retryBackoff" className="mb-1.5">
								重试策略
							</Label>
							<Select
								value={value.retryBackoff}
								onValueChange={(v) =>
									updateField(
										"retryBackoff",
										v as AdvancedConfigState["retryBackoff"],
									)
								}
							>
								<SelectTrigger className="w-full">
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
	);
}

export const defaultAdvancedConfig: AdvancedConfigState = {
	temperature: 0.7,
	maxTokens: 4096,
	thinking: "medium",
	timeout: 60,
	retryAttempts: 3,
	retryBackoff: "exponential",
};
