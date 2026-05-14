"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowLeft01Icon, 
  CheckmarkCircle02Icon, 
  AlertCircleIcon,
  UserGroupIcon,
  Shield02Icon,
  Settings01Icon
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { Workspace } from "@/components/workspace/workspace-types";

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
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    // 模拟加载 Workspace 数据
    const mockWorkspace: Workspace = {
      id: parseInt(workspaceId),
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
    };
    
    setWorkspace(mockWorkspace);
    setFormData({
      name: mockWorkspace.name,
      description: mockWorkspace.description || "",
    });
    setLoading(false);
  }, [workspaceId]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入工作区名称");
      return;
    }

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
        toast.success("保存成功");
        setWorkspace(result.data);
      } else {
        toast.error(result.message || "保存失败");
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-lg font-medium mb-2">工作区不存在</h2>
        <Button variant="outline" asChild>
          <Link href="/admin/workspace">返回列表</Link>
        </Button>
      </div>
    );
  }

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
          <Badge variant={workspace.status === "active" ? "default" : "secondary"}>
            {workspace.status === "active" ? "正常运行" : "已禁用"}
          </Badge>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={1.5} className="size-4 mr-1" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="members">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="size-4 mr-1" />
            成员管理
          </TabsTrigger>
          <TabsTrigger value="security">
            <HugeiconsIcon icon={Shield02Icon} strokeWidth={1.5} className="size-4 mr-1" />
            安全设置
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                修改工作区的名称和描述
              </CardDescription>
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
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>成员管理</CardTitle>
                  <CardDescription>
                    管理有权访问此工作区的用户
                  </CardDescription>
                </div>
                <Button size="sm">邀请成员</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-8">
                成员列表功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>
                配置工作区的访问控制和安全策略
              </CardDescription>
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
                  <Button variant="destructive" size="sm">
                    禁用工作区
                  </Button>
                ) : (
                  <Button size="sm">
                    启用工作区
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}