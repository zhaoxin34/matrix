"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from "@mui/material";

interface RollbackDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetVersion: string;
  loading?: boolean;
}

export default function RollbackDialog({
  open,
  onClose,
  onConfirm,
  targetVersion,
  loading = false,
}: RollbackDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>确认回滚</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          回滚操作将恢复到此版本，回滚会创建新版本记录。
        </Alert>
        <Typography>
          确定要回滚到版本 <strong>v{targetVersion}</strong> 吗？
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onConfirm}
          disabled={loading}
          data-testid="btn-confirm-rollback"
        >
          {loading ? "回滚中..." : "确认回滚"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
