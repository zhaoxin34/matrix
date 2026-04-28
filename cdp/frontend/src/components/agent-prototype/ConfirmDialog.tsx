"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dataTestid?: string;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确定",
  cancelText = "取消",
  onConfirm,
  onCancel,
  dataTestid,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} data-testid={dataTestid}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} data-testid={`${dataTestid}-cancel`}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="contained" data-testid={`${dataTestid}-confirm`}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
