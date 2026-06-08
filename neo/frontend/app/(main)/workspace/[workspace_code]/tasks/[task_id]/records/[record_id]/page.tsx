"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTaskRecord } from "@/lib/api/task";
import type { TaskRecordResponse } from "@/lib/api/task";

const STATUS_COLORS: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	running: "bg-blue-100 text-blue-800",
	success: "bg-green-100 text-green-800",
	failed: "bg-red-100 text-red-800",
	cancelled: "bg-gray-100 text-gray-800",
	paused: "bg-orange-100 text-orange-800",
};

const EXEC_STATUS_LABELS: Record<string, string> = {
	pending: "待执行",
	running: "执行中",
	success: "成功",
	failed: "失败",
	cancelled: "已取消",
	paused: "已暂停",
};

export default function RecordDetailPage() {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const taskId = Number(params.task_id);
	const recordId = Number(params.record_id);

	const [record, setRecord] = useState<TaskRecordResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadData() {
			try {
				setLoading(true);
				const data = await getTaskRecord(workspaceCode, taskId, recordId);
				setRecord(data);
			} catch (err) {
				console.error("获取记录详情失败:", err);
				setError(err instanceof Error ? err.message : "获取记录详情失败");
			} finally {
				setLoading(false);
			}
		}
		loadData();
	}, [workspaceCode, taskId, recordId]);

	if (loading) {
		return <div className="text-center py-8">加载中...</div>;
	}

	if (error || !record) {
		return (
			<div className="text-center py-8">
				<p className="text-red-500">{error || "记录不存在"}</p>
				<Link
					href={`/workspace/${workspaceCode}/tasks/${taskId}`}
					className="mt-4 inline-block px-4 py-2 border rounded-md"
				>
					返回
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link
					href={`/workspace/${workspaceCode}/tasks/${taskId}`}
					className="p-2 hover:bg-muted rounded-md"
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
					<h1 className="text-xl font-medium">执行记录 #{record.id}</h1>
					<p className="text-sm text-muted-foreground mt-1">任务执行详情</p>
				</div>
			</div>

			<div className="border rounded-lg p-6">
				<h2 className="text-lg font-medium mb-4">执行信息</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-muted-foreground">记录 ID</p>
						<p className="font-medium">{record.id}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">任务 ID</p>
						<p className="font-medium">{record.task_id}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">执行状态</p>
						<span
							className={`inline-block px-2 py-0.5 text-sm rounded-full ${STATUS_COLORS[record.exec_status] || ""}`}
						>
							{EXEC_STATUS_LABELS[record.exec_status] || record.exec_status}
						</span>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">耗时</p>
						<p className="font-medium">
							{record.duration ? `${record.duration}ms` : "-"}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">开始时间</p>
						<p className="font-medium">
							{new Date(record.started_at).toLocaleString()}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">结束时间</p>
						<p className="font-medium">
							{record.ended_at
								? new Date(record.ended_at).toLocaleString()
								: "-"}
						</p>
					</div>
				</div>
			</div>

			{record.failure_reason && (
				<div className="border rounded-lg p-6 border-red-200 bg-red-50">
					<h2 className="text-lg font-medium mb-2 text-red-700">失败原因</h2>
					<p className="text-red-600 whitespace-pre-wrap">
						{record.failure_reason}
					</p>
				</div>
			)}

			{record.result && (
				<div className="border rounded-lg p-6">
					<h2 className="text-lg font-medium mb-4">执行结果</h2>
					<pre className="bg-muted p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
						{typeof record.result === "string"
							? record.result
							: JSON.stringify(record.result, null, 2)}
					</pre>
				</div>
			)}

			{record.process && (
				<div className="border rounded-lg p-6">
					<h2 className="text-lg font-medium mb-4">执行过程</h2>
					<pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
						{JSON.stringify(record.process, null, 2)}
					</pre>
				</div>
			)}

			{record.recording_url && (
				<div className="border rounded-lg p-6">
					<h2 className="text-lg font-medium mb-4">录像</h2>
					<p className="text-muted-foreground">录像功能暂未开放</p>
					<p className="text-sm text-muted-foreground mt-1">
						URL: {record.recording_url}
					</p>
				</div>
			)}
		</div>
	);
}
