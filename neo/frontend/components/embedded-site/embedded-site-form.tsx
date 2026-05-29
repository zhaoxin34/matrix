"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  CreateEmbeddedSiteInput,
  EmbeddedSite,
} from "./embedded-site-types";
import {
  createEmbeddedSite,
  updateEmbeddedSite,
  getErrorMessage,
} from "@/lib/api/embedded-sites";

interface EmbeddedSiteFormDialogProps {
  trigger?: React.ReactNode;
  workspaceId: number;
  workspaceCode: string;
  onSuccess?: (site: EmbeddedSite) => void;
}

export function EmbeddedSiteFormDialog({
  trigger,
  workspaceId: _workspaceId,
  workspaceCode,
  onSuccess,
}: EmbeddedSiteFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEmbeddedSiteInput>({
    site_name: "",
    site_url: "",
    description: "",
    status: "ENABLED",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateEmbeddedSiteInput, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateEmbeddedSiteInput, string>> =
      {};

    if (!formData.site_name.trim()) {
      newErrors.site_name = "请输入网站名称";
    } else if (formData.site_name.length > 255) {
      newErrors.site_name = "名称不能超过255个字符";
    }

    if (!formData.site_url.trim()) {
      newErrors.site_url = "请输入网站地址";
    } else {
      try {
        new URL(formData.site_url);
      } catch {
        newErrors.site_url = "请输入有效的URL地址";
      }
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = "描述不能超过5000个字符";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await createEmbeddedSite(workspaceCode, {
        site_name: formData.site_name,
        site_url: formData.site_url,
        description: formData.description,
      });

      setOpen(false);
      setFormData({
        site_name: "",
        site_url: "",
        description: "",
        status: "ENABLED",
      });
      toast.success("嵌入网站创建成功");
      onSuccess?.(data);
    } catch (err: unknown) {
      const error = err as { code?: number; message?: string };
      const errorMsg = error.message || getErrorMessage(error.code || 9001);
      toast.error(errorMsg);
      setErrors({ site_name: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      site_name: "",
      site_url: "",
      description: "",
      status: "ENABLED",
    });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建嵌入网站</DialogTitle>
          <DialogDescription>
            添加一个可以被 Agent 嵌入和学习的网站。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="site_name-dialog">
              网站名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="site_name-dialog"
              placeholder="输入网站名称"
              value={formData.site_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, site_name: e.target.value }))
              }
              aria-invalid={!!errors.site_name}
            />
            {errors.site_name && (
              <p className="text-sm text-destructive">{errors.site_name}</p>
            )}
            <p className="text-sm text-muted-foreground">1-255个字符</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="site_url-dialog">
              网站地址 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="site_url-dialog"
              type="url"
              placeholder="https://example.com"
              value={formData.site_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, site_url: e.target.value }))
              }
              aria-invalid={!!errors.site_url}
            />
            {errors.site_url && (
              <p className="text-sm text-destructive">{errors.site_url}</p>
            )}
            <p className="text-sm text-muted-foreground">
              必须是以 http:// 或 https:// 开头的有效URL
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description-dialog">网站描述</Label>
            <Textarea
              id="description-dialog"
              placeholder="输入网站描述（可选）"
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
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-sm text-muted-foreground">0-5000个字符</p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="status-dialog"
              checked={formData.status === "ENABLED"}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  status: checked ? "ENABLED" : "DISABLED",
                }))
              }
            />
            <Label htmlFor="status-dialog">
              {formData.status === "ENABLED" ? "启用" : "禁用"}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EmbeddedSiteFormProps {
  initialData?: Partial<CreateEmbeddedSiteInput>;
  onSubmit?: (data: CreateEmbeddedSiteInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

export function EmbeddedSiteForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "创建",
  loading = false,
  className,
}: EmbeddedSiteFormProps) {
  const [formData, setFormData] = useState<CreateEmbeddedSiteInput>({
    site_name: initialData?.site_name ?? "",
    site_url: initialData?.site_url ?? "",
    description: initialData?.description ?? "",
    status: initialData?.status ?? "ENABLED",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateEmbeddedSiteInput, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateEmbeddedSiteInput, string>> =
      {};

    if (!formData.site_name.trim()) {
      newErrors.site_name = "请输入网站名称";
    } else if (formData.site_name.length > 255) {
      newErrors.site_name = "名称不能超过255个字符";
    }

    if (!formData.site_url.trim()) {
      newErrors.site_url = "请输入网站地址";
    } else {
      try {
        new URL(formData.site_url);
      } catch {
        newErrors.site_url = "请输入有效的URL地址";
      }
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = "描述不能超过5000个字符";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={`grid gap-4 ${className ?? ""}`}>
      <div className="grid gap-2">
        <Label htmlFor="site_name">
          网站名称 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="site_name"
          placeholder="输入网站名称"
          value={formData.site_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, site_name: e.target.value }))
          }
          aria-invalid={!!errors.site_name}
        />
        {errors.site_name && (
          <p className="text-sm text-destructive">{errors.site_name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="site_url">
          网站地址 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="site_url"
          type="url"
          placeholder="https://example.com"
          value={formData.site_url}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, site_url: e.target.value }))
          }
          aria-invalid={!!errors.site_url}
        />
        {errors.site_url && (
          <p className="text-sm text-destructive">{errors.site_url}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">网站描述</Label>
        <Textarea
          id="description"
          placeholder="输入网站描述（可选）"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          aria-invalid={!!errors.description}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="status"
          checked={formData.status === "ENABLED"}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              status: checked ? "ENABLED" : "DISABLED",
            }))
          }
        />
        <Label htmlFor="status">
          {formData.status === "ENABLED" ? "启用" : "禁用"}
        </Label>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "提交中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

// 用于编辑页面的表单组件 - 客户端组件，处理提交逻辑
interface EditEmbeddedSiteFormProps {
  siteId: string;
  workspaceCode: string;
  initialData: {
    site_name: string;
    site_url: string;
    description?: string;
    status: "ENABLED" | "DISABLED";
  };
  successUrl?: string;
}

export function EditEmbeddedSiteForm({
  siteId,
  workspaceCode,
  initialData,
  successUrl,
}: EditEmbeddedSiteFormProps) {
  const [formData, setFormData] = useState<CreateEmbeddedSiteInput>({
    site_name: initialData.site_name,
    site_url: initialData.site_url,
    description: initialData.description ?? "",
    status: initialData.status,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateEmbeddedSiteInput, string>>
  >({});
  const router = useRouter();

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateEmbeddedSiteInput, string>> =
      {};

    if (!formData.site_name.trim()) {
      newErrors.site_name = "请输入网站名称";
    } else if (formData.site_name.length > 255) {
      newErrors.site_name = "名称不能超过255个字符";
    }

    if (!formData.site_url.trim()) {
      newErrors.site_url = "请输入网站地址";
    } else {
      try {
        new URL(formData.site_url);
      } catch {
        newErrors.site_url = "请输入有效的URL地址";
      }
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = "描述不能超过5000个字符";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await updateEmbeddedSite(workspaceCode, parseInt(siteId), {
        site_name: formData.site_name,
        site_url: formData.site_url,
        description: formData.description,
        status: formData.status,
      });
      toast.success("嵌入网站保存成功");
      if (successUrl) {
        router.push(successUrl);
      }
    } catch (err: unknown) {
      const error = err as { code?: number; message?: string };
      const errorMsg = error.message || getErrorMessage(error.code || 9001);
      toast.error(errorMsg);
      setErrors({ site_name: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit_site_name">
          网站名称 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit_site_name"
          placeholder="输入网站名称"
          value={formData.site_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, site_name: e.target.value }))
          }
          aria-invalid={!!errors.site_name}
        />
        {errors.site_name && (
          <p className="text-sm text-destructive">{errors.site_name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit_site_url">
          网站地址 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit_site_url"
          type="url"
          placeholder="https://example.com"
          value={formData.site_url}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, site_url: e.target.value }))
          }
          aria-invalid={!!errors.site_url}
        />
        {errors.site_url && (
          <p className="text-sm text-destructive">{errors.site_url}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit_description">网站描述</Label>
        <Textarea
          id="edit_description"
          placeholder="输入网站描述（可选）"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          aria-invalid={!!errors.description}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="edit_status"
          checked={formData.status === "ENABLED"}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              status: checked ? "ENABLED" : "DISABLED",
            }))
          }
        />
        <Label htmlFor="edit_status">
          {formData.status === "ENABLED" ? "启用" : "禁用"}
        </Label>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
