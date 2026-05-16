"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder02Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Workspace } from "@/components/workspace/workspace-types";

// Mock data for workspaces
const mockWorkspaces: Workspace[] = [
  {
    id: 1,
    name: "CRM 工作区",
    code: "crm-workspace",
    description: "客户关系管理团队的工作区",
    status: "active",
    org_id: 1,
    owner_id: 1,
    member_count: 15,
    project_count: 8,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-12T15:30:00Z",
  },
  {
    id: 2,
    name: "运营工作区",
    code: "ops-workspace",
    description: "运营团队的工作区，负责日常运营任务",
    status: "active",
    org_id: 1,
    owner_id: 1,
    member_count: 8,
    project_count: 5,
    created_at: "2026-04-15T08:00:00Z",
    updated_at: "2026-05-10T12:00:00Z",
  },
  {
    id: 3,
    name: "产品研发工作区",
    code: "dev-workspace",
    description: "产品研发团队的工作区",
    status: "active",
    org_id: 1,
    owner_id: 1,
    member_count: 25,
    project_count: 12,
    created_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-05-13T10:00:00Z",
  },
];

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
}

// Workspace 切换器组件
export function WorkspaceSwitcher({
  currentWorkspaceId,
}: WorkspaceSwitcherProps) {
  const [workspaces] = useState<Workspace[]>(mockWorkspaces);
  const [currentId, setCurrentId] = useState(
    currentWorkspaceId || mockWorkspaces[0]?.id.toString(),
  );

  const currentWorkspace =
    workspaces.find((ws) => ws.id.toString() === currentId) ||
    mockWorkspaces[0];

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentId(workspace.id.toString());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 min-w-0 items-center gap-2 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-left transition-colors hover:bg-accent hover:text-accent-foreground data-[open=true]:bg-accent data-[open=true]:text-accent-foreground"
        >
          <HugeiconsIcon
            icon={Folder02Icon}
            strokeWidth={1.5}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <div className="flex flex-col gap-0 min-w-0">
            <span className="truncate font-medium leading-tight">
              {currentWorkspace?.name}
            </span>
            <span className="truncate text-[10px] text-muted-foreground leading-tight font-mono">
              {currentWorkspace?.code}
            </span>
          </div>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={1.5}
            className="size-3 shrink-0 text-muted-foreground"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal pb-2">
          切换工作区
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleSelectWorkspace(workspace)}
            className="flex flex-col gap-0.5 cursor-pointer py-2"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{workspace.name}</span>
              {workspace.id.toString() === currentId && (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  className="size-4 text-primary shrink-0"
                />
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {workspace.code}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Main header component for the app
export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <WorkspaceSwitcher />
    </header>
  );
}
