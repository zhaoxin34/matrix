"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { agentPrototypeApi, AgentPrototype } from "@/lib/agentPrototypeApi";
import { useSnackbar } from "@/hooks/useSnackbar";

export default function AgentPrototypeListPage() {
  const router = useRouter();
  const snackbar = useSnackbar();
  const [prototypes, setPrototypes] = useState<AgentPrototype[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchPrototypes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await agentPrototypeApi.list({
        page: page + 1,
        page_size: rowsPerPage,
      });
      setPrototypes(result.items || []);
      setTotal(result.total);
    } catch (e) {
      console.error("Failed to fetch prototypes:", e);
      snackbar.error("加载失败");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchPrototypes();
  }, [fetchPrototypes]);

  const handleCreate = () => {
    router.push("/agent-prototypes/new");
  };

  const handleEdit = (id: string) => {
    router.push(`/agent-prototypes/${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "default";
      case "published":
        return "success";
      case "archived":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "草稿";
      case "published":
        return "已发布";
      case "archived":
        return "已归档";
      default:
        return status;
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          data-testid="btn-create-prototype"
        >
          新建Agent原型
        </Button>
      </Box>

      <Card sx={{ flex: 1, overflow: "hidden" }}>
        <TableContainer sx={{ height: "100%" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>名称</TableCell>
                <TableCell>版本</TableCell>
                <TableCell>模型</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={40} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}
                    >
                      加载中...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : prototypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      暂无原型
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      sx={{ mt: 1 }}
                    >
                      点击「新建Agent原型」创建第一个原型
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                prototypes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>v{p.version}</TableCell>
                      <TableCell>{p.model}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(p.status)}
                          color={
                            getStatusColor(p.status) as
                              | "success"
                              | "warning"
                              | "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(p.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(p.id)}
                          data-testid={`btn-edit-prototype-${p.id}`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="每页行数"
        />
      </Card>
    </Box>
  );
}
