"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Folder02Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import Link from "next/link";
import type {
  Workspace,
  WorkspaceStatus,
} from "@/components/workspace/workspace-types";

/**
 * Admin Workspace List Page
 *
 * 路由: /admin/workspace
 * 角色: 仅限 admin 角色访问
 * 功能: 展示所有 Workspace 列表，支持创建和管理
 */
export default function AdminWorkspaceListPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkspaceStatus | "all">(
    "all",
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWorkspaces = useCallback(
    async (searchQuery: string, status: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (status !== "all") params.set("status", status);

        const response = await fetch(`/api/v1/workspaces?${params}`);
        const result = await response.json();

        if (result.code === 0) {
          setWorkspaces(result.data.list);
        } else {
          toast.error(result.message || "获取工作区列表失败");
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
        toast.error("网络错误，请重试");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchWorkspaces(search, statusFilter);
  }, [fetchWorkspaces, search, statusFilter]);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  const handleStatusFilter = useCallback((status: WorkspaceStatus | "all") => {
    setStatusFilter(status);
  }, []);

  // Mock data for demonstration - admin view shows more info
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
      name: "已禁用工作区",
      code: "disabled-workspace",
      description: "这是一个已禁用的工作区示例",
      status: "disabled",
      org_id: 1,
      owner_id: 1,
      member_count: 3,
      project_count: 1,
      created_at: "2026-03-20T09:00:00Z",
      updated_at: "2026-05-08T18:00:00Z",
    },
  ];

  const displayWorkspaces = loading
    ? []
    : workspaces.length > 0
      ? workspaces
      : mockWorkspaces;

  // Client-side filtering for immediate response
  const filteredWorkspaces = displayWorkspaces.filter((ws) => {
    const matchesSearch =
      !search ||
      ws.name.toLowerCase().includes(search.toLowerCase()) ||
      ws.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || ws.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-medium">工作区管理</h1>
          <p className="text-xs text-muted-foreground mt-1">
            管理系统中的所有工作区
          </p>
        </div>
      </div>

      <WorkspaceHeader
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        currentStatus={statusFilter}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayWorkspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HugeiconsIcon
              icon={Folder02Icon}
              strokeWidth={1.5}
              className="size-12 text-muted-foreground/50 mb-4"
            />
            <h3 className="text-sm font-medium mb-1">暂无工作区</h3>
            <p className="text-xs text-muted-foreground mb-4">
              点击创建按钮添加第一个工作区
            </p>
            <Button asChild>
              <Link href="/admin/workspace/new">
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={1.5}
                  className="size-4 mr-1"
                />
                创建工作区
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkspaces.map((workspace) => (
            <div key={workspace.id} className="relative group">
              <WorkspaceCard workspace={workspace} />
              {/* Admin action overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/admin/workspace/${workspace.id}/settings`}>
                    <HugeiconsIcon
                      icon={Settings01Icon}
                      strokeWidth={1.5}
                      className="size-3 mr-1"
                    />
                    设置
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
