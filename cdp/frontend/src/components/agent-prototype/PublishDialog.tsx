"use client";

import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { AgentPrototype } from "@/lib/agentPrototypeApi";

interface PublishDialogProps {
  open: boolean;
  prototype: AgentPrototype | null;
  onClose: () => void;
  onPublish: (version: string, changeSummary: string) => void;
  onError?: (message: string) => void;
}

export default function PublishDialog({
  open,
  prototype,
  onClose,
  onPublish,
  onError,
}: PublishDialogProps) {
  const [version, setVersion] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!version.trim()) {
      onError?.("请输入版本号");
      return;
    }

    setPublishing(true);
    try {
      await onPublish(version.trim(), changeSummary.trim());
      setVersion("");
      setChangeSummary("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onError?.(msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    setVersion("");
    setChangeSummary("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>发布新版本</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          当前版本: {prototype?.version}
        </Typography>
        <TextField
          label="版本号"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="如: 1.0.0, 1.1.0"
          fullWidth
          required
          sx={{ mb: 2 }}
          data-testid="inp-version"
        />
        <TextField
          label="变更说明"
          value={changeSummary}
          onChange={(e) => setChangeSummary(e.target.value)}
          multiline
          rows={3}
          fullWidth
          placeholder="描述本次发布的主要变更..."
          data-testid="inp-change-summary"
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={handleClose} data-testid="btn-cancel-publish">
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handlePublish}
          disabled={publishing || !version.trim()}
          data-testid="btn-confirm-publish"
        >
          {publishing ? "发布中..." : "发布"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}