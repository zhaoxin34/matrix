"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  onPublish: (changeSummary: string) => void;
  loading?: boolean;
}

export default function PublishDialog({ open, onClose, onPublish, loading }: PublishDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onPublish(formData.get("changeSummary") as string || "");
  };

  return (
    <Dialog open={open} onClose={onClose} data-testid="dlg-publish" maxWidth="sm" fullWidth>
      <DialogTitle>发布新版本</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            name="changeSummary"
            label="变更说明"
            multiline
            rows={3}
            fullWidth
            data-testid="inp-change-summary"
            slotProps={{
              input: {
                placeholder: "描述本次发布的主要变更...",
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} data-testid="btn-cancel-publish" disabled={loading}>
            取消
          </Button>
          <Button type="submit" variant="contained" data-testid="btn-confirm-publish" disabled={loading}>
            发布
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
