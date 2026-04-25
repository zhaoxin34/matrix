import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useState, useCallback } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "确认",
  cancelText = "取消",
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      slotProps={{
        paper: { sx: { minWidth: 320 } },
      }}
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit" data-testid="btn-cancel">
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          data-testid="btn-confirm"
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const confirm = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          title,
          message,
          onConfirm: () => {
            setDialogState((prev) => ({ ...prev, open: false }));
            resolve(true);
          },
        });
      });
    },
    [],
  );

  const handleCancel = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  const ConfirmDialogComponent = useCallback(
    () => (
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={handleCancel}
      />
    ),
    [dialogState, handleCancel],
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
