"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (changeSummary: string) => void;
  loading?: boolean;
}

export default function PublishDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
}: PublishDialogProps) {
  const [changeSummary, setChangeSummary] = useState("");

  const handleConfirm = () => {
    onConfirm(changeSummary);
  };

  const handleClose = () => {
    setChangeSummary("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>发布新版本</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          发布后将创建新的版本快照，当前配置将被固定。
        </Typography>
        <TextField
          fullWidth
          label="变更说明"
          multiline
          rows={3}
          value={changeSummary}
          onChange={(e) => setChangeSummary(e.target.value)}
          placeholder="描述本次发布的主要变更..."
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading}
          data-testid="btn-confirm-publish"
        >
          {loading ? "发布中..." : "发布"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
