"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceStats } from "@/components/workspace/workspace-stats";
import { WorkspaceStatusBadge } from "@/components/workspace/workspace-status-badge";
import { EnableWorkspaceDialog } from "@/components/workspace/disable-workspace-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { Workspace } from "@/components/workspace/workspace-types";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/workspaces/${workspaceId}`);
        const result = await response.json();

        if (result.code === 0) {
          setWorkspace(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch workspace:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  // Mock data for demonstration
  const mockWorkspace: Workspace = {
    id: parseInt(workspaceId),
    name: "CRM 工作区",
    code: "crm-workspace",
    description:
      "客户关系管理团队的工作区，用于管理客户关系、销售流程和市场活动。",
    status: "active",
    org_id: 1,
    owner_id: 1,
    member_count: 15,
    project_count: 8,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-12T15:30:00Z",
  };

  const displayWorkspace = loading ? null : (workspace ?? mockWorkspace);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workspace">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            返回工作区列表
          </Link>
        </Button>
        {displayWorkspace && displayWorkspace.status === "disabled" && (
          <EnableWorkspaceDialog
            workspace={displayWorkspace}
            trigger={
              <Button size="sm" variant="outline">
                启用工作区
              </Button>
            }
            onConfirm={() =>
              setWorkspace((prev) =>
                prev ? { ...prev, status: "active" } : prev,
              )
            }
          />
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} size="sm">
                <CardContent className="p-4">
                  <Skeleton className="h-10 w-10 mb-2" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-12 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : displayWorkspace ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-heading font-medium">
                {displayWorkspace.name}
              </h1>
              <WorkspaceStatusBadge status={displayWorkspace.status} />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {displayWorkspace.code}
            </p>
          </div>

          <WorkspaceStats
            memberCount={displayWorkspace.member_count ?? 0}
            projectCount={displayWorkspace.project_count ?? 0}
            createdAt={displayWorkspace.created_at}
            updatedAt={displayWorkspace.updated_at}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">描述</span>
                  <span className="text-xs">
                    {displayWorkspace.description || "暂无描述"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">组织 ID</span>
                  <span className="text-xs font-mono">
                    {displayWorkspace.org_id}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    所有者 ID
                  </span>
                  <span className="text-xs font-mono">
                    {displayWorkspace.owner_id}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>快速操作</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/workspace/${displayWorkspace.id}/settings`}>
                    <HugeiconsIcon
                      icon={Settings01Icon}
                      strokeWidth={1.5}
                      className="size-4 mr-2"
                    />
                    工作区设置
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              工作区不存在或无权访问
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/workspace">返回列表</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
