"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DisableWorkspaceDialog } from "@/components/workspace/disable-workspace-dialog";
import { WorkspaceMemberList } from "@/components/workspace/workspace-member-list";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, SaveIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import Link from "next/link";
import type {
  Workspace,
  WorkspaceMember,
  UpdateWorkspaceInput,
} from "@/components/workspace/workspace-types";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<UpdateWorkspaceInput>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateWorkspaceInput, string>>
  >({});

  useEffect(() => {
    const fetchWorkspace = async () => {
      setLoading(true);
      try {
        const [wsResponse, membersResponse] = await Promise.all([
          fetch(`/api/v1/workspaces/${workspaceId}`),
          fetch(`/api/v1/workspaces/${workspaceId}/members`),
        ]);

        const wsResult = await wsResponse.json();
        const membersResult = await membersResponse.json();

        if (wsResult.code === 0) {
          setWorkspace(wsResult.data);
          setFormData({
            name: wsResult.data.name,
            description: wsResult.data.description || "",
          });
        }

        if (membersResult.code === 0) {
          setMembers(membersResult.data.list || []);
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
    description: "客户关系管理团队的工作区",
    status: "active",
    org_id: 1,
    owner_id: 1,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-12T15:30:00Z",
  };

  const mockMembers: WorkspaceMember[] = [
    {
      id: 1,
      user_id: 1,
      user_name: "张三",
      user_email: "zhangsan@example.com",
      role: "owner",
      workspace_id: parseInt(workspaceId),
      created_at: "2026-05-01T10:00:00Z",
    },
    {
      id: 2,
      user_id: 2,
      user_name: "李四",
      user_email: "lisi@example.com",
      role: "admin",
      workspace_id: parseInt(workspaceId),
      created_at: "2026-05-02T14:00:00Z",
    },
    {
      id: 3,
      user_id: 3,
      user_name: "王五",
      user_email: "wangwu@example.com",
      role: "member",
      workspace_id: parseInt(workspaceId),
      created_at: "2026-05-03T09:00:00Z",
    },
  ];

  const displayWorkspace = loading ? null : (workspace ?? mockWorkspace);
  const displayMembers = loading
    ? []
    : members.length > 0
      ? members
      : mockMembers;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateWorkspaceInput, string>> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "请输入工作区名称";
    } else if (formData.name.length > 50) {
      newErrors.name = "名称不能超过50个字符";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "描述不能超过500个字符";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.code === 0) {
        setWorkspace(result.data);
        toast.success("保存成功");
      } else {
        toast.error(result.message || "保存失败");
        setErrors({ name: result.message || "保存失败" });
      }
    } catch {
      toast.error("网络错误，请重试");
      setErrors({ name: "网络错误，请重试" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/workspace/${workspaceId}`}>
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            返回工作区
          </Link>
        </Button>
        {displayWorkspace?.status === "active" && (
          <DisableWorkspaceDialog
            workspace={displayWorkspace}
            trigger={
              <Button size="sm" variant="destructive">
                禁用工作区
              </Button>
            }
            onConfirm={() =>
              setWorkspace((prev) =>
                prev ? { ...prev, status: "disabled" } : prev,
              )
            }
          />
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-heading font-medium">工作区设置</h1>
        <p className="text-xs text-muted-foreground">
          管理工作区的基本信息、成员和安全设置
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : displayWorkspace ? (
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-medium">
                  工作区名称 <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="输入工作区名称"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="text-xs font-medium">
                  标识符
                </label>
                <Input
                  id="code"
                  value={displayWorkspace.code}
                  disabled
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  URL 友好标识符，创建后不可修改
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-xs font-medium">
                  描述
                </label>
                <Textarea
                  id="description"
                  placeholder="输入工作区描述（可选）"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  aria-invalid={!!errors.description}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">创建时间</span>
                <span className="text-xs font-mono">
                  {new Date(displayWorkspace.created_at).toLocaleString(
                    "zh-CN",
                  )}
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <HugeiconsIcon
                    icon={SaveIcon}
                    strokeWidth={1.5}
                    className="size-4 mr-1"
                  />
                  {saving ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <WorkspaceMemberList
            members={displayMembers}
            currentUserId={1}
            isOwner={true}
            onInvite={async (email, role) => {
              console.log("Invite:", email, role);
            }}
            onRemove={async (memberId) => {
              console.log("Remove:", memberId);
            }}
            onChangeRole={async (memberId, role) => {
              console.log("Change role:", memberId, role);
            }}
          />

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">危险区域</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium">禁用工作区</p>
                  <p className="text-xs text-muted-foreground">
                    禁用后所有成员将无法访问该工作区，但数据将被保留
                  </p>
                </div>
                <DisableWorkspaceDialog
                  workspace={displayWorkspace}
                  trigger={
                    <Button size="sm" variant="destructive">
                      禁用工作区
                    </Button>
                  }
                  onConfirm={() =>
                    setWorkspace((prev) =>
                      prev ? { ...prev, status: "disabled" } : prev,
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
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
