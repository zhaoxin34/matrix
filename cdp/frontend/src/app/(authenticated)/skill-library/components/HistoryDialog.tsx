"use client";

import { useState, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ReactMarkdown from "react-markdown";
import HistoryIcon from "@mui/icons-material/History";
import RollbackIcon from "@mui/icons-material/Restore";
import { Skill, SkillVersion, skillApi } from "@/lib/skillApi";

interface HistoryDialogProps {
  open: boolean;
  skill: Skill | null;
  onClose: () => void;
  onRollback: (code: string, version: string) => Promise<Skill>;
  onRollbackSuccess?: (updatedSkill: Skill) => Promise<void>;
}

export function HistoryDialog({
  open,
  skill,
  onClose,
  onRollback,
  onRollbackSuccess,
}: HistoryDialogProps) {
  const [versions, setVersions] = useState<SkillVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<SkillVersion | null>(
    null,
  );
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    if (!skill) return;
    setLoading(true);
    try {
      const data = await skillApi.getVersions(skill.code);
      setVersions(data);
      if (data.length > 0 && !selectedVersion) {
        setSelectedVersion(data[0]);
      }
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [skill, selectedVersion]);

  useEffect(() => {
    if (open && skill) {
      loadVersions();
    } else {
      setVersions([]);
      setSelectedVersion(null);
    }
  }, [open, skill, loadVersions]);

  const handleRollback = async (version: string) => {
    if (!skill) return;
    setRollingBack(version);
    try {
      const updatedSkill = await onRollback(skill.code, version);
      // Notify parent with updated skill data, then reload versions
      if (onRollbackSuccess && updatedSkill) {
        await onRollbackSuccess(updatedSkill);
      }
      // Reload versions and auto-select the new current version
      const newVersions = await skillApi.getVersions(skill.code);
      setVersions(newVersions);
      // Auto-select the version that matches the updated skill's version
      const targetVersion = updatedSkill?.version || skill.version;
      const newCurrentVersion = newVersions.find(
        (v) => v.version === targetVersion,
      );
      setSelectedVersion(newCurrentVersion || null);
    } finally {
      setRollingBack(null);
    }
  };

  const handleClose = () => {
    setVersions([]);
    setSelectedVersion(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <HistoryIcon color="action" fontSize="small" />
        版本历史 - {skill?.code}
      </DialogTitle>
      <DialogContent sx={{ p: 0, minHeight: 600 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
            }}
          >
            <CircularProgress />
          </Box>
        ) : versions.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
              gap: 2,
            }}
          >
            <HistoryIcon sx={{ fontSize: 48, color: "text.disabled" }} />
            <Typography color="text.secondary">暂无版本历史</Typography>
            <Typography variant="caption" color="text.disabled">
              发布技能后将自动创建版本记录
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", height: 600, px: 1 }}>
            {/* Left: Version List */}
            <Box
              sx={{
                width: 260,
                borderRight: "1px solid",
                borderColor: "divider",
                overflow: "auto",
                bgcolor: "grey.50",
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  {versions.length} 个版本
                </Typography>
              </Box>
              <List sx={{ pt: 0 }}>
                {versions.map((v) => (
                  <ListItem
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    sx={{
                      cursor: "pointer",
                      bgcolor:
                        selectedVersion?.id === v.id
                          ? "rgba(24, 144, 255, 0.12)"
                          : "transparent",
                      borderLeft:
                        selectedVersion?.id === v.id
                          ? "3px solid"
                          : "3px solid transparent",
                      borderLeftColor:
                        selectedVersion?.id === v.id
                          ? "primary.main"
                          : "transparent",
                      "&:hover": {
                        bgcolor:
                          selectedVersion?.id === v.id
                            ? "rgba(24, 144, 255, 0.18)"
                            : "action.hover",
                      },
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      flexDirection: "column",
                      alignItems: "stretch",
                      py: 1.5,
                      px: 2,
                      transition: "all 150ms ease",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: selectedVersion?.id === v.id ? 700 : 500,
                          color:
                            selectedVersion?.id === v.id
                              ? "primary.main"
                              : "text.primary",
                          fontSize: "0.8rem",
                        }}
                      >
                        {v.version}
                      </Typography>
                      {v.version === skill?.version && (
                        <Chip
                          label="当前版本"
                          size="small"
                          color="success"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            selectedVersion?.id === v.id
                              ? "primary.main"
                              : "text.secondary",
                          opacity: selectedVersion?.id === v.id ? 0.8 : 1,
                          fontSize: "0.7rem",
                        }}
                      >
                        {new Date(v.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    {v.comment && (
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          color:
                            selectedVersion?.id === v.id
                              ? "text.secondary"
                              : "text.disabled",
                          fontSize: "0.7rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.comment}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Right: Content Preview */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {selectedVersion ? (
                <>
                  {/* Header */}
                  <Box
                    sx={{
                      p: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {selectedVersion.version}
                          </Typography>
                          {selectedVersion.version === skill?.version && (
                            <Chip
                              label="当前版本"
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(
                            selectedVersion.created_at,
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                      {selectedVersion.version !== skill?.version && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          startIcon={<RollbackIcon />}
                          onClick={() =>
                            handleRollback(selectedVersion.version)
                          }
                          disabled={rollingBack === selectedVersion.version}
                          data-testid={`btn-rollback-${selectedVersion.version}`}
                          sx={{ textTransform: "none" }}
                        >
                          {rollingBack === selectedVersion.version
                            ? "回滚中..."
                            : "回滚到此版本"}
                        </Button>
                      )}
                    </Box>
                    {selectedVersion.comment && (
                      <Alert severity="info" sx={{ mt: 1.5, py: 0 }}>
                        {selectedVersion.comment}
                      </Alert>
                    )}
                  </Box>

                  {/* Content */}
                  <Box
                    sx={{ flex: 1, overflow: "auto", p: 3, bgcolor: "grey.50" }}
                  >
                    {selectedVersion.content ? (
                      <Box
                        sx={{
                          bgcolor: "background.paper",
                          p: 3,
                          borderRadius: 2,
                          boxShadow: 1,
                          minHeight: 200,
                          "& h1": {
                            fontSize: "1.5rem",
                            fontWeight: 600,
                            mb: 1,
                          },
                          "& h2": {
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            mb: 1,
                            mt: 2,
                          },
                          "& h3": {
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            mb: 1,
                            mt: 1.5,
                          },
                          "& p": { mb: 1.5, lineHeight: 1.7 },
                          "& code": {
                            bgcolor: "grey.100",
                            px: 0.5,
                            borderRadius: 0.5,
                            fontFamily: "monospace",
                            fontSize: "0.875em",
                          },
                          "& pre": {
                            bgcolor: "grey.900",
                            color: "grey.100",
                            p: 2,
                            borderRadius: 1,
                            overflow: "auto",
                            "& code": { bgcolor: "transparent", p: 0 },
                          },
                          "& ul, & ol": { pl: 3, mb: 1.5 },
                          "& li": { mb: 0.5 },
                        }}
                      >
                        <ReactMarkdown>{selectedVersion.content}</ReactMarkdown>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          height: 200,
                          bgcolor: "background.paper",
                          borderRadius: 2,
                          border: "2px dashed",
                          borderColor: "divider",
                        }}
                      >
                        <Typography color="text.secondary">暂无内容</Typography>
                      </Box>
                    )}
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    bgcolor: "grey.50",
                  }}
                >
                  <Typography color="text.secondary">
                    选择一个版本查看内容
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button
          onClick={handleClose}
          data-testid="btn-history-close"
          size="small"
        >
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
}
