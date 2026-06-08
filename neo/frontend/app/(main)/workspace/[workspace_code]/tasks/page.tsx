"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { listTasks } from "@/lib/api/task";
import type { TaskResponse } from "@/lib/api/task";

const PRIORITY_COLORS: Record<string, string> = {
	low: "bg-gray-100 text-gray-800",
	medium: "bg-blue-100 text-blue-800",
	high: "bg-orange-100 text-orange-800",
	urgent: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	running: "bg-blue-100 text-blue-800",
	success: "bg-green-100 text-green-800",
	failed: "bg-red-100 text-red-800",
	cancelled: "bg-gray-100 text-gray-800",
	paused: "bg-orange-100 text-orange-800",
};

const TASK_TYPE_LABELS: Record<string, string> = {
	periodic: "周期任务",
	temporary: "临时任务",
	dispatch: "派发任务",
};

const PRIORITY_LABELS: Record<string, string> = {
	low: "低",
	medium: "中",
	high: "高",
	urgent: "紧急",
};

export default function TaskListPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;

	const [tasks, setTasks] = useState<TaskResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadTasks = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await listTasks(workspaceCode, {
				page: 1,
				page_size: 100,
			});
			setTasks(response.items);
		} catch (err) {
			console.error("Failed to fetch tasks:", err);
			setError(err instanceof Error ? err.message : "获取任务列表失败");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadTasks();
	}, [workspaceCode]);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-medium">任务列表</h1>
					<p className="text-sm text-muted-foreground mt-1">
						管理当前 Workspace 下的所有任务
					</p>
				</div>
				<button
					onClick={() =>
						(window.location.href = `/workspace/${workspaceCode}/tasks/create`)
					}
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					创建任务
				</button>
			</div>

			{loading ? (
				<div className="text-center py-8">加载中...</div>
			) : error ? (
				<div className="text-center py-8">
					<p className="text-red-500">{error}</p>
					<button
						onClick={loadTasks}
						className="mt-4 px-4 py-2 border rounded-md"
					>
						重试
					</button>
				</div>
			) : tasks.length === 0 ? (
				<div className="text-center py-8">
					<p className="text-muted-foreground">暂无任务</p>
				</div>
			) : (
				<div className="space-y-4">
					{tasks.map((task) => (
						<div key={task.id} className="p-4 border rounded-lg">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium">{task.name}</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full ${PRIORITY_COLORS[task.priority] || ""}`}
										>
											{PRIORITY_LABELS[task.priority] || task.priority}
										</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full ${task.status === "enabled" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
										>
											{task.status === "enabled" ? "启用" : "禁用"}
										</span>
									</div>
									<div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
										<span>ID: {task.id}</span>
										<span>
											{TASK_TYPE_LABELS[task.task_type] || task.task_type}
										</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[task.last_exec_status] || ""}`}
										>
											{task.last_exec_status}
										</span>
										{task.cron_expression && (
											<span>{task.cron_expression}</span>
										)}
									</div>
									{task.description && (
										<p className="mt-2 text-sm text-muted-foreground">
											{task.description}
										</p>
									)}
									<p className="mt-2 text-xs text-muted-foreground">
										创建于 {new Date(task.created_at).toLocaleString()}
									</p>
								</div>
								<div className="flex items-center gap-2 ml-4">
									<a
										href={`/workspace/${workspaceCode}/tasks/${task.id}`}
										className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
									>
										查看
									</a>
									{task.task_type === "periodic" && (
										<a
											href={`/workspace/${workspaceCode}/tasks/${task.id}/edit`}
											className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
										>
											编辑
										</a>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
