"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskExecStatus, TaskPriority, TaskType } from "./task-types";

interface TaskListHeaderProps {
  onSearch: (search: string) => void;
  onStatusFilter: (status: TaskExecStatus | "all") => void;
  onTypeFilter: (type: TaskType | "all") => void;
  onPriorityFilter: (priority: TaskPriority | "all") => void;
  currentStatus: TaskExecStatus | "all";
  currentType: TaskType | "all";
  currentPriority: TaskPriority | "all";
  createUrl: string;
}

const STATUS_OPTIONS: { value: TaskExecStatus | "all"; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待执行" },
  { value: "running", label: "执行中" },
  { value: "success", label: "成功" },
  { value: "failed", label: "失败" },
  { value: "cancelled", label: "已取消" },
];

const TYPE_OPTIONS: { value: TaskType | "all"; label: string }[] = [
  { value: "all", label: "全部类型" },
  { value: "periodic", label: "周期任务" },
  { value: "temporary", label: "临时任务" },
  { value: "dispatch", label: "派发任务" },
];

const PRIORITY_OPTIONS: { value: TaskPriority | "all"; label: string }[] = [
  { value: "all", label: "全部优先级" },
  { value: "urgent", label: "紧急" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

export function TaskListHeader({
  onSearch,
  onStatusFilter,
  onTypeFilter,
  onPriorityFilter,
  currentStatus,
  currentType,
  currentPriority,
  createUrl,
}: TaskListHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            placeholder="搜索任务名称或 ID..."
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={currentStatus === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-1">
            {TYPE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={currentType === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => onTypeFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex flex-wrap gap-1">
            {PRIORITY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={currentPriority === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => onPriorityFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <Button onClick={() => router.push(createUrl)} className="ml-auto">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            创建任务
          </Button>
        </div>
      </div>
    </div>
  );
}
