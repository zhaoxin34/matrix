"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "./task-types";
import {
  TASK_EXEC_STATUS_COLORS,
  TASK_EXEC_STATUS_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
} from "./task-types";
import {
  deleteTask,
  disableTask,
  enableTask,
  cancelTask,
} from "@/lib/api/task";

interface TaskCardProps {
  task: Task;
  workspaceCode: string;
  onRefresh: () => void;
}

export function TaskCard({ task, workspaceCode, onRefresh }: TaskCardProps) {
  const handleCancel = async () => {
    if (
      !window.confirm(
        `确定要取消任务 "${task.name}" 吗？取消后任务将无法再次执行。`,
      )
    ) {
      return;
    }
    try {
      await cancelTask(workspaceCode, task.id);
      toast.success("任务已取消");
      onRefresh();
    } catch (error) {
      toast.error("取消失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  const handleDisable = async () => {
    try {
      await disableTask(workspaceCode, task.id);
      toast.success("任务已禁用");
      onRefresh();
    } catch (error) {
      toast.error("禁用失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  const handleEnable = async () => {
    try {
      await enableTask(workspaceCode, task.id);
      toast.success("任务已启用");
      onRefresh();
    } catch (error) {
      toast.error("启用失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`确定要删除任务 "${task.name}" 吗？此操作无法撤销。`)) {
      return;
    }
    try {
      await deleteTask(workspaceCode, task.id);
      toast.success("任务已删除");
      onRefresh();
    } catch (error) {
      toast.error("删除失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  };

  const handlePauseResume = () => {
    toast.warning("功能暂不支持", {
      description: "暂停/继续功能暂未开放",
    });
  };

  const isPeriodic = task.task_type === "periodic";
  const canCancel =
    task.last_exec_status !== "cancelled" &&
    task.last_exec_status !== "success";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/workspace/${workspaceCode}/tasks/${task.id}`}
                className="text-lg font-medium hover:text-primary truncate"
              >
                {task.name}
              </Link>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${TASK_PRIORITY_COLORS[task.priority]}`}
              >
                {TASK_PRIORITY_LABELS[task.priority]}
              </span>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  task.status === "enabled"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {task.status === "enabled" ? "启用" : "禁用"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                ID: {task.id}
              </span>
              <span>{TASK_TYPE_LABELS[task.task_type]}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${TASK_EXEC_STATUS_COLORS[task.last_exec_status]}`}
              >
                {TASK_EXEC_STATUS_LABELS[task.last_exec_status]}
              </span>
              {task.cron_expression && (
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {task.cron_expression}
                </span>
              )}
            </div>

            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>创建者: {task.creator_name || task.creator_id}</span>
              <span>执行者: {task.executor_name || task.executor_id}</span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              创建于 {new Date(task.created_at).toLocaleString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/workspace/${workspaceCode}/tasks/${task.id}`}>
                查看
              </Link>
            </Button>

            {isPeriodic && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`/workspace/${workspaceCode}/tasks/${task.id}/edit`}
                  >
                    编辑
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  删除
                </Button>
              </>
            )}

            {canCancel && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                取消
              </Button>
            )}

            {task.status === "enabled" ? (
              <Button variant="outline" size="sm" onClick={handleDisable}>
                禁用
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleEnable}>
                启用
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handlePauseResume}>
              暂停
            </Button>
            <Button variant="outline" size="sm" onClick={handlePauseResume}>
              继续
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
