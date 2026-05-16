"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DisablePrototypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototypeId: string;
  prototypeName: string;
  onSuccess?: () => void;
}

export function DisablePrototypeDialog({
  open,
  onOpenChange,
  prototypeId,
  prototypeName,
  onSuccess,
}: DisablePrototypeDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDisable = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/agent_prototype/${prototypeId}/disable`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const result = await response.json();

      if (result.code === 0) {
        toast.success("已禁用");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.message || "操作失败");
      }
    } catch (error) {
      console.error("Failed to disable:", error);
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>禁用 Agent 原型</DialogTitle>
          <DialogDescription>
            确定要禁用「{prototypeName}」吗？禁用后将无法使用。
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={loading}
          >
            {loading ? "处理中..." : "确认禁用"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EnablePrototypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototypeId: string;
  prototypeName: string;
  onSuccess?: () => void;
}

export function EnablePrototypeDialog({
  open,
  onOpenChange,
  prototypeId,
  prototypeName,
  onSuccess,
}: EnablePrototypeDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/agent_prototype/${prototypeId}/enable`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const result = await response.json();

      if (result.code === 0) {
        toast.success("已启用");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.message || "操作失败");
      }
    } catch (error) {
      console.error("Failed to enable:", error);
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>启用 Agent 原型</DialogTitle>
          <DialogDescription>
            确定要启用「{prototypeName}」吗？
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleEnable} disabled={loading}>
            {loading ? "处理中..." : "确认启用"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
