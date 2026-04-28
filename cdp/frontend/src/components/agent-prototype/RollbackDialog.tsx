"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

interface RollbackDialogProps {
  open: boolean;
  version: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function RollbackDialog({ open, version, onClose, onConfirm, loading }: RollbackDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} data-testid="dlg-rollback">
      <DialogTitle>确认回滚</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          确定要回滚到版本 <strong>{version}</strong> 吗？回滚将创建一个新的版本记录。
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid="btn-cancel-rollback" disabled={loading}>
          取消
        </Button>
        <Button onClick={onConfirm} variant="contained" data-testid="btn-confirm-rollback" disabled={loading}>
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
}
