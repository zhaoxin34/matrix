/**
 * Task types for the frontend
 */

export type TaskType = "temporary" | "periodic" | "dispatch";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "enabled" | "disabled";
export type TaskExecStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "paused";

export interface Task {
  id: number;
  name: string;
  description: string | null;
  content: string | null;
  workspace_id: number;
  agent_id: number;
  owner_id: number;
  priority: TaskPriority;
  task_type: TaskType;
  last_exec_status: TaskExecStatus;
  status: TaskStatus;
  max_retry: number;
  retry_interval: number;
  webhook_url: string | null;
  webhook_secret: string | null;
  cron_expression: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskRecord {
  id: number;
  task_id: number;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  exec_status: string;
  result: string | null;
  process: Record<string, unknown> | null;
  failure_reason: string | null;
  recording_url: string | null;
  created_at: string;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  temporary: "临时任务",
  periodic: "周期任务",
  dispatch: "派发任务",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  enabled: "启用",
  disabled: "禁用",
};

export const TASK_EXEC_STATUS_LABELS: Record<TaskExecStatus, string> = {
  pending: "待执行",
  running: "执行中",
  success: "成功",
  failed: "失败",
  cancelled: "已取消",
  paused: "已暂停",
};

export const TASK_EXEC_STATUS_COLORS: Record<TaskExecStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  paused: "bg-orange-100 text-orange-800",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};
