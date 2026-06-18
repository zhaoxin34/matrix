"use client";

import { useState, useEffect } from "react";
import { getMyTasks } from "@/lib/api/task";
import type {
  MyTaskResponse,
  TaskMyRole,
  TaskExecStatus,
  TaskType,
  TaskPriority,
} from "@/lib/api/task";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const MY_ROLE_LABELS: Record<TaskMyRole, string> = {
  creator: "我创建的",
  executor: "我执行的",
};

const MY_ROLE_COLORS: Record<TaskMyRole, string> = {
  creator: "bg-purple-100 text-purple-800",
  executor: "bg-teal-100 text-teal-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "等待执行",
  running: "执行中",
  success: "执行成功",
  failed: "执行失败",
  cancelled: "已取消",
  paused: "已暂停",
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const loadTasks = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyTasks({
        page: pageNum,
        page_size: pageSize,
        my_role: (filterRole === "all" ? undefined : filterRole) as
          | TaskMyRole
          | undefined,
        last_exec_status: (filterStatus === "all"
          ? undefined
          : filterStatus) as TaskExecStatus | undefined,
        task_type: (filterType === "all" ? undefined : filterType) as
          | TaskType
          | undefined,
        priority: (filterPriority === "all" ? undefined : filterPriority) as
          | TaskPriority
          | undefined,
      });
      setTasks(response.items);
      setTotal(response.total);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err instanceof Error ? err.message : "获取任务列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, filterStatus, filterType, filterPriority]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium">我的任务</h1>
        <p className="text-sm text-muted-foreground mt-1">
          查看您创建或参与执行的所有任务
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Task type filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">类型:</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="periodic">周期任务</SelectItem>
              <SelectItem value="temporary">临时任务</SelectItem>
              <SelectItem value="dispatch">派发任务</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">优先级:</span>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="low">低</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="urgent">紧急</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">角色:</span>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="creator">我创建的</SelectItem>
              <SelectItem value="executor">我执行的</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">等待执行</SelectItem>
              <SelectItem value="running">执行中</SelectItem>
              <SelectItem value="success">执行成功</SelectItem>
              <SelectItem value="failed">执行失败</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="paused">已暂停</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => loadTasks(1)}
            className="mt-4 px-4 py-2 border"
          >
            重试
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">暂无任务</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.name}</span>
                    <span
                      className={`px-2 py-0.5 text-xs ${MY_ROLE_COLORS[task.my_role]}`}
                    >
                      {MY_ROLE_LABELS[task.my_role]}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs ${PRIORITY_COLORS[task.priority] || ""}`}
                    >
                      {PRIORITY_LABELS[task.priority] || task.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs ${task.status === "enabled" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
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
                      className={`px-2 py-0.5 text-xs ${STATUS_COLORS[task.last_exec_status] || ""}`}
                    >
                      {STATUS_LABELS[task.last_exec_status] ||
                        task.last_exec_status}
                    </span>
                    <span
                      className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700"
                      title={task.workspace_name}
                    >
                      {task.workspace_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>创建者: {task.creator_name || task.creator_id}</span>
                    <span>
                      执行者: {task.executor_name || task.executor_id}
                    </span>
                    <span>Agent: {task.agent_name || task.agent_id}</span>
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
                    href={`/workspace/${task.workspace_code}/tasks/${task.id}`}
                    className="px-3 py-1 text-sm border hover:bg-muted"
                  >
                    查看
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => loadTasks(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border disabled:opacity-50 hover:bg-muted"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
              <button
                onClick={() => loadTasks(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border disabled:opacity-50 hover:bg-muted"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
