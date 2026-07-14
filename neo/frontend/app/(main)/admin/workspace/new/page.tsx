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
import type { CreateWorkspaceInput } from "@/components/workspace/workspace-types";
import { createWorkspace } from "@/lib/api/workspace";
import { useOrganizationStore } from "@/hooks/use-organization-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminCreateWorkspacePage() {
  const router = useRouter();
  const orgUnits = useOrganizationStore((s) => s.orgUnits);
  const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);
  const setSelectedOrgId = useOrganizationStore((s) => s.setSelectedOrgId);
  const loadOrgUnits = useOrganizationStore((s) => s.loadOrgUnits);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateWorkspaceInput, string>>
  >({});

  // 初始化加载 org 数据
  useEffect(() => {
    if (orgUnits.length === 0) {
      loadOrgUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // orgUnits 和 loadOrgUnits 来自 store，变化时不需要重新执行

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

    const currentOrgId = useOrganizationStore.getState().selectedOrgId;
    if (!currentOrgId) {
      toast.error("请先选择一个组织");
      return;
    }

    setLoading(true);
    try {
      const workspace = await createWorkspace({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        org_id: currentOrgId,
      });
      toast.success("工作区创建成功");
      router.push(`/admin/workspace/${workspace.id}/settings`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "创建失败");
      setErrors({ name: err.message || "创建失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (value: string) => {
    setSelectedOrgId(parseInt(value, 10));
  };

  const isLoadingOrgs = orgUnits.length === 0;

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
              <label htmlFor="org" className="text-sm font-medium">
                所属组织 <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedOrgId?.toString() || ""}
                onValueChange={handleOrgChange}
                disabled={isLoadingOrgs}
              >
                <SelectTrigger id="org">
                  <SelectValue
                    placeholder={isLoadingOrgs ? "加载中..." : "选择组织"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {orgUnits.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit" disabled={loading || isLoadingOrgs}>
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
