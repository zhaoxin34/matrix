"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getTask, updateTask } from "@/lib/api/task";
import type { TaskResponse } from "@/lib/api/task";

interface Agent {
	id: number;
	name: string;
}

const PRIORITY_OPTIONS = [
	{ value: "low", label: "低" },
	{ value: "medium", label: "中" },
	{ value: "high", label: "高" },
	{ value: "urgent", label: "紧急" },
];

export default function EditTaskPage() {
	const params = useParams();
	const router = useRouter();
	const workspaceCode = params.workspace_code as string;
	const taskId = Number(params.task_id);

	const [task, setTask] = useState<TaskResponse | null>(null);
	const [agents, setAgents] = useState<Agent[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [content, setContent] = useState("");
	const [agentId, setAgentId] = useState<number | null>(null);
	const [priority, setPriority] = useState("medium");
	const [cronExpression, setCronExpression] = useState("");
	const [maxRetry, setMaxRetry] = useState(3);
	const [retryInterval, setRetryInterval] = useState(60);

	useEffect(() => {
		async function loadData() {
			try {
				setLoading(true);
				const [taskData, agentsResponse] = await Promise.all([
					getTask(workspaceCode, taskId),
					fetch(
						`/api/v1/workspaces/${workspaceCode}/agents?page=1&page_size=100`,
					).then((r) => r.json()),
				]);

				if (taskData.task_type !== "periodic") {
					setError("只有周期任务可以编辑");
					return;
				}

				setTask(taskData);
				setName(taskData.name);
				setDescription(taskData.description || "");
				setContent(taskData.content || "");
				setAgentId(taskData.agent_id);
				setPriority(taskData.priority);
				setCronExpression(taskData.cron_expression || "");
				setMaxRetry(taskData.max_retry);
				setRetryInterval(taskData.retry_interval);

				if (agentsResponse.code === 0 && agentsResponse.data) {
					setAgents(agentsResponse.data.items || []);
				}
			} catch (err) {
				console.error("获取数据失败:", err);
				setError(err instanceof Error ? err.message : "获取数据失败");
			} finally {
				setLoading(false);
			}
		}
		loadData();
	}, [workspaceCode, taskId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			setError("请输入任务名称");
			return;
		}

		if (!agentId) {
			setError("请选择执行 Agent");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			await updateTask(workspaceCode, taskId, {
				name: name.trim(),
				description: description.trim() || undefined,
				content: content.trim() || undefined,
				agent_id: agentId,
				priority: priority as "low" | "medium" | "high" | "urgent",
				cron_expression: cronExpression.trim() || undefined,
				max_retry: maxRetry,
				retry_interval: retryInterval,
			});
			router.push(`/workspace/${workspaceCode}/tasks/${taskId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "更新失败");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return <div className="text-center py-8">加载中...</div>;
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-500">{error}</p>
				<Link
					href={`/workspace/${workspaceCode}/tasks/${taskId}`}
					className="mt-4 inline-block px-4 py-2 border"
				>
					返回
				</Link>
			</div>
		);
	}

	if (!task) {
		return (
			<div className="text-center py-8">
				<p>任务不存在</p>
				<Link
					href={`/workspace/${workspaceCode}/tasks`}
					className="mt-4 inline-block px-4 py-2 border"
				>
					返回列表
				</Link>
			</div>
		);
	}

	return (
		<div className="max-w-2xl">
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="flex items-center gap-4">
					<Link
						href={`/workspace/${workspaceCode}/tasks/${taskId}`}
						className="p-2 hover:bg-muted"
					>
						<svg
							className="h-5 w-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</Link>
					<div className="flex-1">
						<h1 className="text-xl font-medium">编辑任务</h1>
						<p className="text-sm text-muted-foreground mt-1">修改任务配置</p>
					</div>
				</div>

				{error && (
					<div className="p-4 text-sm text-red-500 bg-red-50 border border-red-200">
						{error}
					</div>
				)}

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1.5">
							任务名称 <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="输入任务名称"
							className="w-full px-3 py-2 border"
							maxLength={100}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">
							执行 Agent <span className="text-red-500">*</span>
						</label>
						<select
							value={agentId || ""}
							onChange={(e) => setAgentId(Number(e.target.value) || null)}
							className="w-full px-3 py-2 border"
						>
							<option value="">选择 Agent</option>
							{agents.map((agent) => (
								<option key={agent.id} value={agent.id}>
									{agent.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">优先级</label>
						<div className="flex gap-2">
							{PRIORITY_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setPriority(opt.value)}
									className={`px-3 py-1.5 text-sm border ${
										priority === opt.value
											? "bg-primary text-primary-foreground"
											: "bg-background hover:bg-muted"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">
							Cron 表达式
						</label>
						<input
							type="text"
							value={cronExpression}
							onChange={(e) => setCronExpression(e.target.value)}
							placeholder="0 0 * * * (每天凌晨)"
							className="w-full px-3 py-2 border"
						/>
						<p className="text-xs text-muted-foreground mt-1">
							格式: 分 时 日 月 周
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1.5">
								最大重试次数
							</label>
							<input
								type="number"
								value={maxRetry}
								onChange={(e) => setMaxRetry(Number(e.target.value))}
								min={0}
								max={10}
								className="w-full px-3 py-2 border"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1.5">
								重试间隔(秒)
							</label>
							<input
								type="number"
								value={retryInterval}
								onChange={(e) => setRetryInterval(Number(e.target.value))}
								min={0}
								max={3600}
								className="w-full px-3 py-2 border"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">描述</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="输入任务描述（可选）"
							rows={3}
							className="w-full px-3 py-2 border"
							maxLength={500}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">任务内容</label>
						<textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="输入任务具体内容（可选）"
							rows={5}
							className="w-full px-3 py-2 border font-mono text-sm"
						/>
					</div>
				</div>

				<div className="flex items-center justify-end gap-2">
					<Link
						href={`/workspace/${workspaceCode}/tasks/${taskId}`}
						className="px-4 py-2 border hover:bg-muted"
					>
						取消
					</Link>
					<button
						type="submit"
						disabled={submitting}
						className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{submitting ? "保存中..." : "保存"}
					</button>
				</div>
			</form>
		</div>
	);
}
