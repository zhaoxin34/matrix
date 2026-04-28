"use client";

import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Skill, SkillVersion } from "@/lib/skillApi";

interface PublishDialogProps {
  open: boolean;
  skill: Skill | null;
  onClose: () => void;
  onPublish: (
    code: string,
    data: { version: string; comment: string },
  ) => Promise<void>;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function PublishDialog({
  open,
  skill,
  onClose,
  onPublish,
  onSuccess,
  onError,
}: PublishDialogProps) {
  const [version, setVersion] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!skill || !version.trim() || !comment.trim()) return;
    setLoading(true);
    try {
      await onPublish(skill.code, {
        version: version.trim(),
        comment: comment.trim(),
      });
      setVersion("");
      setComment("");
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVersion("");
    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>发布技能 - {skill?.code}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            fullWidth
            label="版本号"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="例如: 1.0.0"
            required
            data-testid="inp-publish-version"
          />
          <TextField
            fullWidth
            label="发布说明"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请输入发布说明"
            required
            multiline
            rows={3}
            data-testid="inp-publish-comment"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} data-testid="btn-publish-cancel">
          取消
        </Button>
        <Button
          onClick={handlePublish}
          variant="contained"
          disabled={loading || !version.trim() || !comment.trim()}
          data-testid="btn-publish-confirm"
        >
          {loading ? "发布中..." : "发布"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
