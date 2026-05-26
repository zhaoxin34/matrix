import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkspaceStatusBadge } from "./workspace-status-badge";
import type { Workspace } from "./workspace-types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TeamWorkIcon,
  Settings01Icon,
  AiFolder01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

interface WorkspaceCardProps {
  workspace: Workspace;
  className?: string;
}

export function WorkspaceCard({ workspace, className }: WorkspaceCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{workspace.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {workspace.code}
            </p>
          </div>
          <WorkspaceStatusBadge status={workspace.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workspace.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {workspace.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <HugeiconsIcon
                icon={TeamWorkIcon}
                strokeWidth={1.5}
                className="size-3.5"
              />
              {workspace.member_count ?? 0} 成员
            </span>
            <span className="flex items-center gap-1">
              <HugeiconsIcon
                icon={AiFolder01Icon}
                strokeWidth={1.5}
                className="size-3.5"
              />
              {workspace.project_count ?? 0} 项目
            </span>
          </div>
        </div>
      </CardContent>
      <CardAction className="px-4 pb-4 pt-0 flex items-center gap-2">
        <Button asChild size="sm">
          <Link href={`/workspace/${workspace.id}`}>查看</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/workspace/${workspace.id}/settings`}>
            <HugeiconsIcon
              icon={Settings01Icon}
              strokeWidth={1.5}
              className="size-3.5 mr-1"
            />
            设置
          </Link>
        </Button>
      </CardAction>
    </Card>
  );
}
