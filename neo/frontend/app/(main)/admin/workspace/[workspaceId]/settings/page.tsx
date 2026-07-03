"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  Shield02Icon,
  Settings01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import {
  getWorkspace,
  updateWorkspace,
  enableWorkspace,
  disableWorkspace,
  getWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMember,
  type Workspace,
  type WorkspaceMember,
} from "@/lib/api/workspace";
import { WorkspaceMemberList } from "@/components/workspace/workspace-member-list";
import { useCurrentUser } from "@/hooks/use-auth-store";

/**
 * Admin Workspace Settings Page
 *
 * 路由: /admin/workspace/{workspaceId}/settings
 * 角色: 仅限 admin 角色访问
 * 功能: Workspace 配置管理（基本信息、成员、安全设置等）
 */
export default function AdminWorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = parseInt(params.workspaceId as string, 10);
  const currentUser = useCurrentUser();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [membersLoading, setMembersLoading] = useState(false);

  // Fetch workspace data
  const fetchWorkspace = useCallback(async () => {
    try {
      const data = await getWorkspace(workspaceId);
      if (data) {
        setWorkspace(data);
        setFormData({
          name: data.name,
          description: data.description || "",
        });
      } else {
        toast.error("工作区不存在");
        router.push("/admin/workspace");
      }
    } catch {
      toast.error("获取工作区信息失败");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, router]);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const result = await getWorkspaceMembers(workspaceId);
      setMembers(result.list);
    } catch {
      toast.error("获取成员列表失败");
    } finally {
      setMembersLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!isNaN(workspaceId)) {
      fetchWorkspace();
      fetchMembers();
    }
  }, [fetchWorkspace, fetchMembers, workspaceId]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入工作区名称");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateWorkspace(workspaceId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setWorkspace(updated);
      toast.success("保存成功");
      fetchWorkspace();
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleEnable = async () => {
    try {
      const updated = await enableWorkspace(workspaceId);
      setWorkspace(updated);
      toast.success("工作区已启用");
      fetchWorkspace();
    } catch {
      toast.error("启用失败");
    }
  };

  const handleDisable = async () => {
    try {
      const updated = await disableWorkspace(workspaceId);
      setWorkspace(updated);
      toast.success("工作区已禁用");
      fetchWorkspace();
    } catch {
      toast.error("禁用失败");
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      await removeWorkspaceMember(workspaceId, memberId);
      toast.success("成员已移除");
      fetchMembers();
    } catch {
      toast.error("移除成员失败");
    }
  };

  const handleChangeRole = async (memberId: number, role: string) => {
    try {
      await updateWorkspaceMember(workspaceId, memberId, role);
      toast.success("角色已更新");
      fetchMembers();
    } catch {
      toast.error("更新角色失败");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  const isOwner = workspace.owner_id === currentUser?.user_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/workspace">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            返回工作区列表
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-medium">工作区设置</h1>
            <p className="text-xs text-muted-foreground mt-1">
              配置和管理工作区基本信息和成员
            </p>
          </div>
          <Badge
            variant={workspace.status === "active" ? "default" : "secondary"}
          >
            {workspace.status === "active" ? "正常运行" : "已禁用"}
          </Badge>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">
            <HugeiconsIcon
              icon={Settings01Icon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="members">
            <HugeiconsIcon
              icon={UserGroupIcon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            成员管理
          </TabsTrigger>
          <TabsTrigger value="security">
            <HugeiconsIcon
              icon={Shield02Icon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            安全设置
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>修改工作区的名称和描述</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  工作区名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">标识符（只读）</Label>
                <Input
                  id="code"
                  value={workspace.code}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  标识符用于 URL，不可修改
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Owner Info */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>所有者信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">所有者 ID</p>
                  <p className="text-xs text-muted-foreground">
                    {workspace.owner_id}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  转移所有权
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          {membersLoading ? (
            <Card>
              <CardContent className="py-8">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : (
            <WorkspaceMemberList
              members={members}
              currentUserId={currentUser?.user_id}
              isOwner={isOwner}
              onRemove={isOwner ? handleRemoveMember : undefined}
              onChangeRole={isOwner ? handleChangeRole : undefined}
            />
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>配置工作区的访问控制和安全策略</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">禁用工作区</p>
                  <p className="text-xs text-muted-foreground">
                    禁用后所有成员将无法访问此工作区，数据保留
                  </p>
                </div>
                {workspace.status === "active" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisable}
                    disabled={!isOwner}
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      strokeWidth={1.5}
                      className="size-4 mr-1"
                    />
                    禁用工作区
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleEnable}>
                    启用工作区
                  </Button>
                )}
              </div>
              {!isOwner && (
                <p className="text-xs text-muted-foreground">
                  只有工作区所有者可以修改此设置
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
