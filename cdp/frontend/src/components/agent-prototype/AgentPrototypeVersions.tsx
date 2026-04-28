"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  agentPrototypeApi,
  AgentPrototypeVersion,
} from "@/lib/agentPrototypeApi";
import RollbackDialog from "./RollbackDialog";
import { useSnackbar } from "@/hooks/useSnackbar";

interface AgentPrototypeVersionsProps {
  prototypeId: string;
  currentVersion: string;
}

export default function AgentPrototypeVersions({
  prototypeId,
  currentVersion,
}: AgentPrototypeVersionsProps) {
  const [versions, setVersions] = useState<AgentPrototypeVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollbackDialog, setRollbackDialog] = useState<{
    open: boolean;
    targetVersion: string;
  }>({ open: false, targetVersion: "" });
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const snackbar = useSnackbar();

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentPrototypeApi.listVersions(prototypeId);
      setVersions(data);
    } catch (e) {
      console.error("Failed to fetch versions:", e);
    } finally {
      setLoading(false);
    }
  }, [prototypeId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRollback = async () => {
    setRollbackLoading(true);
    try {
      await agentPrototypeApi.rollback(prototypeId, {
        version: rollbackDialog.targetVersion,
      });
      snackbar.success("回滚成功");
      setRollbackDialog({ open: false, targetVersion: "" });
      fetchVersions();
    } catch (e) {
      console.error("Failed to rollback:", e);
      snackbar.error("回滚失败");
    } finally {
      setRollbackLoading(false);
    }
  };

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : versions.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary">暂无版本记录</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>版本</TableCell>
                <TableCell>变更说明</TableCell>
                <TableCell>发布时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        fontWeight: v.version === currentVersion ? 700 : 400,
                        color:
                          v.version === currentVersion
                            ? "primary.main"
                            : "text.primary",
                      }}
                    >
                      v{v.version}
                      {v.version === currentVersion && " (当前)"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={v.change_summary || ""}
                    >
                      {v.change_summary || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(v.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {v.version !== currentVersion && (
                      <Button
                        size="small"
                        onClick={() =>
                          setRollbackDialog({
                            open: true,
                            targetVersion: v.version,
                          })
                        }
                        data-testid={`btn-rollback-${v.version}`}
                      >
                        回滚
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <RollbackDialog
        open={rollbackDialog.open}
        onClose={() => setRollbackDialog({ open: false, targetVersion: "" })}
        onConfirm={handleRollback}
        targetVersion={rollbackDialog.targetVersion}
        loading={rollbackLoading}
      />
    </Box>
  );
}
