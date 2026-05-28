"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { getOrganizationUnits, createWorkspace } from "@/lib/api/workspace";

interface CreateWorkspaceInput {
  name: string;
  description: string;
  org_id: number;
}

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
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<
    { id: number; name: string; code: string }[]
  >([]);
  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: "",
    description: "",
    org_id: 0,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateWorkspaceInput, string>>
  >({});

  // Fetch organizations on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchOrgs() {
      setOrgsLoading(true);
      try {
        const orgs = await getOrganizationUnits();
        if (!cancelled) {
          setOrganizations(orgs);
          // Auto-select first organization
          if (orgs.length > 0) {
            setFormData((prev) => ({ ...prev, org_id: orgs[0].id }));
          }
        }
      } catch {
        if (!cancelled) {
          console.error("Failed to fetch organizations");
          toast.error("获取组织列表失败");
        }
      } finally {
        if (!cancelled) {
          setOrgsLoading(false);
        }
      }
    }

    fetchOrgs();

    return () => {
      cancelled = true;
    };
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateWorkspaceInput, string>> = {};

    if (!formData.org_id) {
      newErrors.org_id = "请选择一个组织";
    }

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
      await createWorkspace({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        org_id: formData.org_id,
      });
      toast.success("工作区创建成功");
      router.push("/admin/workspace");
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建失败";
      toast.error(message);
      setErrors({ name: message });
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
        <p className="text-sm text-muted-foreground mt-1">
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
              <label htmlFor="org_id" className="text-sm font-medium">
                所属组织 <span className="text-destructive">*</span>
              </label>
              {orgsLoading ? (
                <Input disabled placeholder="加载中..." />
              ) : organizations.length === 0 ? (
                <Input
                  disabled
                  placeholder="无可用组织，请先创建组织"
                  className="border-destructive"
                />
              ) : (
                <select
                  id="org_id"
                  value={formData.org_id || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      org_id: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">选择组织...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.org_id && (
                <p className="text-sm text-destructive">{errors.org_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
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
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
              <p className="text-sm text-muted-foreground">
                1-50个字符，系统将自动生成唯一的 URL 标识符
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
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
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
              <p className="text-sm text-muted-foreground">
                0-500个字符，帮助团队成员了解工作区的用途
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit" disabled={loading || orgsLoading}>
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
