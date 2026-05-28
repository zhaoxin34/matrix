"use client";

import { useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder02Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useOrganizationStore } from "@/hooks/use-organization-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

// Workspace Switcher 组件
export function WorkspaceSwitcher() {
  const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);
  const loadOrgUnits = useOrganizationStore((s) => s.loadOrgUnits);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const hasOrgId = useWorkspaceStore((s) => s.hasOrgId);
  const setCurrentWorkspaceId = useWorkspaceStore(
    (s) => s.setCurrentWorkspaceId,
  );
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  // 初始化加载 org
  useEffect(() => {
    if (!selectedOrgId) {
      loadOrgUnits();
    }
  }, []);

  // 当 org 变化时加载工作区
  useEffect(() => {
    if (selectedOrgId) {
      loadWorkspaces(selectedOrgId);
    }
  }, [selectedOrgId]);

  const handleSelectWorkspace = (workspace: (typeof workspaces)[0]) => {
    setCurrentWorkspaceId(workspace.id);
  };

  // 没有 org 时显示默认状态
  if (!hasOrgId) {
    return (
      <div className="flex h-8 items-center gap-2 px-2 text-xs text-muted-foreground">
        加载中...
      </div>
    );
  }

  // 工作区列表为空
  if (!isLoading && workspaces.length === 0) {
    return (
      <div className="flex h-8 items-center gap-2 text-xs text-muted-foreground">
        暂无工作区
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 min-w-0 items-center gap-2 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-left transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
        >
          <HugeiconsIcon
            icon={Folder02Icon}
            strokeWidth={1.5}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <div className="flex flex-col gap-0 min-w-0">
            <span className="truncate font-medium leading-tight">
              {isLoading ? "加载中..." : currentWorkspace?.name || "选择工作区"}
            </span>
            <span className="truncate text-[10px] text-muted-foreground leading-tight font-mono">
              {currentWorkspace?.code || "—"}
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
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleSelectWorkspace(workspace)}
            className="flex flex-col gap-0.5 cursor-pointer py-2"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{workspace.name}</span>
              {currentWorkspaceId === workspace.id && (
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
