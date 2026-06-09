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
  const [filterRole, setFilterRole] = useState<TaskMyRole | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskExecStatus | null>(null);
  const [filterType, setFilterType] = useState<TaskType | null>(null);
  const [filterPriority, setFilterPriority] = useState<TaskPriority | null>(
    null,
  );

  const loadTasks = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyTasks({
        page: pageNum,
        page_size: pageSize,
        my_role: filterRole || undefined,
        last_exec_status: filterStatus || undefined,
        task_type: filterType || undefined,
        priority: filterPriority || undefined,
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
      <div className="flex flex-wrap gap-4">
        {/* Task type filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">类型:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterType(null)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterType === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterType("periodic")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterType === "periodic"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              周期任务
            </button>
            <button
              onClick={() => setFilterType("temporary")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterType === "temporary"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              临时任务
            </button>
            <button
              onClick={() => setFilterType("dispatch")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterType === "dispatch"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              派发任务
            </button>
          </div>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">优先级:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterPriority(null)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterPriority === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterPriority("high")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterPriority === "high"
                  ? "bg-orange-600 text-white"
                  : "bg-orange-100 text-orange-800 hover:bg-orange-200"
              }`}
            >
              高
            </button>
            <button
              onClick={() => setFilterPriority("urgent")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterPriority === "urgent"
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              紧急
            </button>
          </div>
        </div>
        {/* Role filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">角色:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterRole(null)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterRole === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterRole("creator")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterRole === "creator"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 text-purple-800 hover:bg-purple-200"
              }`}
            >
              我创建的
            </button>
            <button
              onClick={() => setFilterRole("executor")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterRole === "executor"
                  ? "bg-teal-600 text-white"
                  : "bg-teal-100 text-teal-800 hover:bg-teal-200"
              }`}
            >
              我执行的
            </button>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterStatus(null)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterStatus === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterStatus === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              }`}
            >
              等待执行
            </button>
            <button
              onClick={() => setFilterStatus("running")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterStatus === "running"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              执行中
            </button>
            <button
              onClick={() => setFilterStatus("success")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterStatus === "success"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              执行成功
            </button>
            <button
              onClick={() => setFilterStatus("failed")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterStatus === "failed"
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              执行失败
            </button>
          </div>
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
                      className={`px-2 py-0.5 text-xs rounded-full ${MY_ROLE_COLORS[task.my_role]}`}
                    >
                      {MY_ROLE_LABELS[task.my_role]}
                    </span>
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
                      {STATUS_LABELS[task.last_exec_status] ||
                        task.last_exec_status}
                    </span>
                    <span
                      className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700"
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
                    className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
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
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
              <button
                onClick={() => loadTasks(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted"
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
