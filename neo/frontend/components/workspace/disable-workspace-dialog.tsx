"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { DangerIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import type { Workspace } from "./workspace-types";

interface DisableWorkspaceDialogProps {
  workspace: Workspace;
  onConfirm?: () => void | Promise<void>;
  trigger?: React.ReactNode;
}

export function DisableWorkspaceDialog({
  workspace,
  onConfirm,
  trigger,
}: DisableWorkspaceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDisable = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/workspaces/${workspace.id}/disable`,
        {
          method: "POST",
        },
      );

      const result = await response.json();

      if (result.code === 0) {
        setOpen(false);
        toast.success("工作区已禁用");
        onConfirm?.();
        router.refresh();
      } else {
        toast.error(result.message || "禁用失败");
      }
    } catch (error) {
      console.error("Failed to disable workspace:", error);
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={DangerIcon}
              strokeWidth={1.5}
              className="size-5 text-destructive"
            />
            禁用工作区
          </DialogTitle>
          <DialogDescription>
            确定要禁用工作区「{workspace.name}」吗？
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-none border border-destructive/20 bg-destructive/5 p-3">
            <h4 className="text-xs font-medium text-destructive mb-2">
              注意事项
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>禁用后所有成员将无法访问该工作区</li>
              <li>工作区内的所有资源将保留但不可访问</li>
              <li>可以随时重新启用此工作区</li>
              <li>禁用操作将被记录到审计日志</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={loading}
          >
            {loading ? "禁用中..." : "确认禁用"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EnableWorkspaceDialogProps {
  workspace: Workspace;
  onConfirm?: () => void;
  trigger?: React.ReactNode;
}

export function EnableWorkspaceDialog({
  workspace,
  onConfirm,
  trigger,
}: EnableWorkspaceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/workspaces/${workspace.id}/enable`,
        {
          method: "POST",
        },
      );

      const result = await response.json();

      if (result.code === 0) {
        setOpen(false);
        toast.success("工作区已启用");
        onConfirm?.();
        router.refresh();
      } else {
        toast.error(result.message || "启用失败");
      }
    } catch (error) {
      console.error("Failed to enable workspace:", error);
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              strokeWidth={1.5}
              className="size-5 text-primary"
            />
            启用工作区
          </DialogTitle>
          <DialogDescription>
            确定要重新启用工作区「{workspace.name}」吗？
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-xs text-muted-foreground">
            启用后，该工作区及其所有资源将恢复正常访问。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleEnable} disabled={loading}>
            {loading ? "启用中..." : "确认启用"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
