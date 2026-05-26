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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prototypeId: string;
  currentVersion: string | null;
  onSuccess?: () => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  prototypeId,
  currentVersion,
  onSuccess,
}: PublishDialogProps) {
  const [changeSummary, setChangeSummary] = useState("");
  const [publishing, setPublishing] = useState(false);

  const calculateNextVersion = (current: string | null): string => {
    if (!current) return "1.0.0";
    const parts = current.split(".");
    const patch = parseInt(parts[2] || "0", 10) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  };

  const nextVersion = calculateNextVersion(currentVersion);

  const handlePublish = async () => {
    if (!changeSummary.trim()) {
      toast.error("请输入变更说明");
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch(
        `/api/v1/agent_prototype/${prototypeId}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ change_summary: changeSummary }),
        },
      );
      const result = await response.json();

      if (result.code === 0) {
        toast.success("发布成功");
        setChangeSummary("");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.message || "发布失败");
      }
    } catch (error) {
      console.error("Failed to publish:", error);
      toast.error("网络错误，请重试");
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    setChangeSummary("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>发布新版本</DialogTitle>
          <DialogDescription>确认变更内容并发布版本</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Version Info */}
          <div className="flex items-center gap-4 p-3 bg-muted rounded-md">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">当前版本</p>
              <p className="text-sm font-mono font-medium">
                {currentVersion ?? "-"}
              </p>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">新版本</p>
              <p className="text-sm font-mono font-medium text-primary">
                v{nextVersion}
              </p>
            </div>
          </div>

          {/* Change Summary */}
          <div className="space-y-2">
            <Label htmlFor="change-summary">
              变更说明 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="change-summary"
              placeholder="描述本次发布的主要变更..."
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              rows={4}
              disabled={publishing}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={publishing}>
            取消
          </Button>
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing ? "发布中..." : "确认发布"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
