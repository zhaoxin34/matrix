"use client";

import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TeamWorkIcon,
  AiFolder01Icon,
  Calendar03Icon,
  Clock02Icon,
} from "@hugeicons/core-free-icons";

interface WorkspaceStatsProps {
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function WorkspaceStats({
  memberCount,
  projectCount,
  createdAt,
  updatedAt,
  className,
}: WorkspaceStatsProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className ?? ""}`}>
      <Card size="sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex items-center justify-center size-10 rounded-none bg-primary/10">
            <HugeiconsIcon
              icon={TeamWorkIcon}
              strokeWidth={1.5}
              className="size-5 text-primary"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-medium tabular-nums">
              {memberCount}
            </span>
            <span className="text-xs text-muted-foreground">成员</span>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex items-center justify-center size-10 rounded-none bg-primary/10">
            <HugeiconsIcon
              icon={AiFolder01Icon}
              strokeWidth={1.5}
              className="size-5 text-primary"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-medium tabular-nums">
              {projectCount}
            </span>
            <span className="text-xs text-muted-foreground">项目</span>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex items-center justify-center size-10 rounded-none bg-primary/10">
            <HugeiconsIcon
              icon={Calendar03Icon}
              strokeWidth={1.5}
              className="size-5 text-primary"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium">{formatDate(createdAt)}</span>
            <span className="text-xs text-muted-foreground">创建时间</span>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex items-center justify-center size-10 rounded-none bg-primary/10">
            <HugeiconsIcon
              icon={Clock02Icon}
              strokeWidth={1.5}
              className="size-5 text-primary"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium">{formatDate(updatedAt)}</span>
            <span className="text-xs text-muted-foreground">更新时间</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
