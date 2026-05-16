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

interface DeletePrototypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototypeId: string | number;
  prototypeName: string;
  onSuccess?: () => void;
  onDeleted?: () => void;
}

export function DeletePrototypeDialog({
  open,
  onOpenChange,
  prototypeId,
  prototypeName,
  onSuccess,
  onDeleted,
}: DeletePrototypeDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/agent_prototype/${prototypeId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();

      if (result.code === 0) {
        toast.success("已删除");
        onDeleted?.();
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.message || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>删除 Agent 原型</DialogTitle>
          <DialogDescription>
            确定要删除「{prototypeName}」吗？此操作不可恢复。
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
          注意：只有草稿状态的原型可以被删除
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
