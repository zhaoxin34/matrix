"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import type { CreateWorkspaceInput, Workspace } from "./workspace-types";

interface WorkspaceFormDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (workspace: Workspace) => void;
}

export function WorkspaceFormDialog({
  trigger,
  onSuccess,
}: WorkspaceFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  const handleSubmit = async () => {
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
        setOpen(false);
        setFormData({ name: "", description: "" });
        onSuccess?.(result.data);
        router.push(`/workspace/${result.data.id}`);
      } else {
        setErrors({ name: result.message || "创建失败" });
      }
    } catch {
      setErrors({ name: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({ name: "", description: "" });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建工作区</DialogTitle>
          <DialogDescription>
            创建一个新的工作区来隔离和管理团队资源。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
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
              1-50个字符，自动生成唯一标识符
            </p>
          </div>

          <div className="grid gap-2">
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
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">0-500个字符</p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WorkspaceFormProps {
  initialData?: Partial<CreateWorkspaceInput>;
  onSubmit?: (data: CreateWorkspaceInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

export function WorkspaceForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "创建",
  loading = false,
  className,
}: WorkspaceFormProps) {
  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
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
    await onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={`grid gap-4 ${className ?? ""}`}>
      <div className="grid gap-2">
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

      <div className="grid gap-2">
        <label htmlFor="description" className="text-xs font-medium">
          描述
        </label>
        <Textarea
          id="description"
          placeholder="输入工作区描述（可选）"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          aria-invalid={!!errors.description}
          rows={3}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
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
