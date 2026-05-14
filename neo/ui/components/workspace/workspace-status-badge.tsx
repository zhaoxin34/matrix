import { Badge } from "@/components/ui/badge";
import type { WorkspaceStatus } from "./workspace-types";

interface WorkspaceStatusBadgeProps {
  status: WorkspaceStatus;
  className?: string;
}

const statusConfig: Record<
  WorkspaceStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "ghost";
  }
> = {
  active: {
    label: "活跃",
    variant: "default",
  },
  disabled: {
    label: "已禁用",
    variant: "secondary",
  },
};

export function WorkspaceStatusBadge({
  status,
  className,
}: WorkspaceStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
