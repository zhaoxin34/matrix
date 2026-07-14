"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
	getTask,
	listTaskRecords,
	disableTask,
	enableTask,
	cancelTask,
} from "@/lib/api/task";
import type { TaskResponse, TaskRecordResponse } from "@/lib/api/task";

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

const EXEC_STATUS_LABELS: Record<string, string> = {
	pending: "待执行",
	running: "执行中",
	success: "成功",
	failed: "失败",
	cancelled: "已取消",
	paused: "已暂停",
};

export default function TaskDetailPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const taskId = Number(params.task_id);

	const [task, setTask] = useState<TaskResponse | null>(null);
	const [records, setRecords] = useState<TaskRecordResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const [taskData, recordsData] = await Promise.all([
				getTask(workspaceCode, taskId),
				listTaskRecords(workspaceCode, taskId, { page: 1, page_size: 20 }),
			]);
			setTask(taskData);
			setRecords(recordsData.items);
		} catch (err) {
			console.error("获取任务详情失败:", err);
			setError(err instanceof Error ? err.message : "获取任务详情失败");
		} finally {
			setLoading(false);
		}
	}, [workspaceCode, taskId]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const handleDisable = async () => {
		if (!window.confirm("确定要禁用此任务吗？")) return;
		setActionLoading("disable");
		try {
			await disableTask(workspaceCode, taskId);
			loadData();
		} catch (err) {
			alert(err instanceof Error ? err.message : "禁用失败");
		} finally {
			setActionLoading(null);
		}
	};

	const handleEnable = async () => {
		setActionLoading("enable");
		try {
			await enableTask(workspaceCode, taskId);
			loadData();
		} catch (err) {
			alert(err instanceof Error ? err.message : "启用失败");
		} finally {
			setActionLoading(null);
		}
	};

	const handleCancel = async () => {
		if (!window.confirm("确定要取消此任务吗？")) return;
		setActionLoading("cancel");
		try {
			await cancelTask(workspaceCode, taskId);
			loadData();
		} catch (err) {
			alert(err instanceof Error ? err.message : "取消失败");
		} finally {
			setActionLoading(null);
		}
	};

	if (loading) {
		return <div className="text-center py-8">加载中...</div>;
	}

	if (error || !task) {
		return (
			<div className="text-center py-8">
				<p className="text-red-500">{error || "任务不存在"}</p>
				<Link
					href={`/workspace/${workspaceCode}/tasks`}
					className="mt-4 inline-block px-4 py-2 border"
				>
					返回列表
				</Link>
			</div>
		);
	}

	const priorityColors: Record<string, string> = {
		low: "bg-gray-100 text-gray-800",
		medium: "bg-blue-100 text-blue-800",
		high: "bg-orange-100 text-orange-800",
		urgent: "bg-red-100 text-red-800",
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link
						href={`/workspace/${workspaceCode}/tasks`}
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
					<div>
						<h1 className="text-xl font-medium">{task.name}</h1>
						<p className="text-sm text-muted-foreground mt-1">任务详情</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{task.task_type === "periodic" && (
						<Link
							href={`/workspace/${workspaceCode}/tasks/${taskId}/edit`}
							className="px-4 py-2 border hover:bg-muted"
						>
							编辑
						</Link>
					)}
					{task.last_exec_status !== "success" &&
						task.last_exec_status !== "cancelled" && (
							<button
								onClick={handleCancel}
								disabled={actionLoading === "cancel"}
								className="px-4 py-2 border hover:bg-muted disabled:opacity-50"
							>
								取消
							</button>
						)}
					{task.status === "enabled" ? (
						<button
							onClick={handleDisable}
							disabled={actionLoading === "disable"}
							className="px-4 py-2 border hover:bg-muted disabled:opacity-50"
						>
							禁用
						</button>
					) : (
						<button
							onClick={handleEnable}
							disabled={actionLoading === "enable"}
							className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							启用
						</button>
					)}
				</div>
			</div>

			<div className="border p-6">
				<h2 className="text-lg font-medium mb-4">基本信息</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">任务 ID</p>
						<p className="font-medium">{task.id}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">任务类型</p>
						<p className="font-medium">
							{TASK_TYPE_LABELS[task.task_type] || task.task_type}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">优先级</p>
						<span
							className={`inline-block px-2 py-0.5 text-sm ${priorityColors[task.priority] || ""}`}
						>
							{PRIORITY_LABELS[task.priority] || task.priority}
						</span>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">状态</p>
						<span
							className={`inline-block px-2 py-0.5 text-sm ${task.status === "enabled" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
						>
							{task.status === "enabled" ? "启用" : "禁用"}
						</span>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">执行状态</p>
						<span
							className={`inline-block px-2 py-0.5 text-sm ${STATUS_COLORS[task.last_exec_status] || ""}`}
						>
							{EXEC_STATUS_LABELS[task.last_exec_status] ||
								task.last_exec_status}
						</span>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Cron 表达式</p>
						<p className="font-medium">{task.cron_expression || "-"}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">创建者</p>
						<p className="font-medium">
							{task.creator_name || task.creator_id}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">执行者</p>
						<p className="font-medium">
							{task.executor_name || task.executor_id}
						</p>
					</div>
				</div>

				{task.description && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground">描述</p>
						<p className="mt-1">{task.description}</p>
					</div>
				)}

				<div className="mt-4 text-sm text-muted-foreground">
					<p>创建于 {new Date(task.created_at).toLocaleString()}</p>
					<p>更新于 {new Date(task.updated_at).toLocaleString()}</p>
				</div>
			</div>

			<div className="border p-6">
				<h2 className="text-lg font-medium mb-4">执行记录</h2>
				{records.length === 0 ? (
					<p className="text-muted-foreground">暂无执行记录</p>
				) : (
					<div className="space-y-2">
						{records.map((record) => (
							<Link
								key={record.id}
								href={`/workspace/${workspaceCode}/tasks/${taskId}/records/${record.id}`}
								className="flex items-center justify-between p-3 border hover:bg-muted"
							>
								<div>
									<p className="font-medium">#{record.id}</p>
									<p className="text-sm text-muted-foreground">
										{new Date(record.started_at).toLocaleString()}
									</p>
								</div>
								<div className="text-right">
									<span
										className={`inline-block px-2 py-0.5 text-sm ${STATUS_COLORS[record.exec_status] || ""}`}
									>
										{EXEC_STATUS_LABELS[record.exec_status] ||
											record.exec_status}
									</span>
									{record.duration && (
										<p className="text-sm text-muted-foreground mt-1">
											耗时 {record.duration}ms
										</p>
									)}
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
