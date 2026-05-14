"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { CreateWorkspaceInput } from "@/components/workspace/workspace-types";

/**
 * Admin Create Workspace Page
 * 
 * 路由: /admin/workspace/new
 * 角色: 仅限 admin 角色访问
 * 功能: 创建新的 Workspace（管理员权限）
 */
export default function AdminCreateWorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateWorkspaceInput, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateWorkspaceInput, string>> = {};

    if (!formData.name.trim()) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.code === 0) {
        toast.success("工作区创建成功");
        router.push(`/admin/workspace`);
      } else {
        toast.error(result.message || "创建失败");
        setErrors({ name: result.message || "创建失败" });
      }
    } catch {
      toast.error("网络错误，请重试");
      setErrors({ name: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
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
        <h1 className="text-xl font-heading font-medium">创建工作区</h1>
        <p className="text-xs text-muted-foreground mt-1">
          创建一个新的工作区来隔离和管理团队资源
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-xs text-muted-foreground">
                1-50个字符，系统将自动生成唯一的 URL 标识符
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
                rows={4}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                0-500个字符，帮助团队成员了解工作区的用途
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading ? "创建中..." : "创建工作区"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/workspace">取消</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
