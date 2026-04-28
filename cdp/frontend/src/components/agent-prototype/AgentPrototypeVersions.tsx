"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import type { VersionResponse } from "@/lib/agentPrototypeApi";
import RollbackDialog from "./RollbackDialog";

interface AgentPrototypeVersionsProps {
  versions: VersionResponse[];
  currentVersion: string;
  onRollback: (version: string) => void;
}

export default function AgentPrototypeVersions({ versions, currentVersion, onRollback }: AgentPrototypeVersionsProps) {
  const [rollbackVersion, setRollbackVersion] = useState<string | null>(null);

  return (
    <Box>
      <TableContainer component={Paper} data-testid="version-list">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>版本</TableCell>
              <TableCell>变更说明</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {versions.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ fontWeight: v.version === currentVersion ? 600 : 400 }}
                  >
                    {v.version}
                    {v.version === currentVersion && " (当前)"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {v.change_summary || "-"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(v.created_at).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {v.version !== currentVersion && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setRollbackVersion(v.version)}
                      data-testid={`btn-rollback-${v.version}`}
                    >
                      回滚
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {versions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" component="span" sx={{ py: 2, display: "block" }}>
                    暂无版本记录
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <RollbackDialog
        open={rollbackVersion !== null}
        version={rollbackVersion || ""}
        onClose={() => setRollbackVersion(null)}
        onConfirm={() => {
          if (rollbackVersion) {
            onRollback(rollbackVersion);
            setRollbackVersion(null);
          }
        }}
      />
    </Box>
  );
}
