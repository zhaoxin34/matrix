"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Pagination from "@mui/material/Pagination";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import Stack from "@mui/material/Stack";
import { agentPrototypeApi, AgentPrototype, AgentPrototypeStatus } from "@/lib/agentPrototypeApi";
import { useSnackbar } from "@/hooks/useSnackbar";

const statusLabels: Record<AgentPrototypeStatus, string> = {
  draft: "草稿",
  enabled: "已启用",
  disabled: "已禁用",
};

const statusColors: Record<AgentPrototypeStatus, "default" | "success" | "warning"> = {
  draft: "default",
  enabled: "success",
  disabled: "warning",
};

export default function AgentPrototypeListPage() {
  const router = useRouter();
  const snackbar = useSnackbar();
  const [prototypes, setPrototypes] = useState<AgentPrototype[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadPrototypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentPrototypeApi.list({
        page,
        page_size: 20,
        status: statusFilter || undefined,
        keyword: keyword || undefined,
      });
      setPrototypes(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      snackbar.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, keyword, snackbar]);

  useEffect(() => {
    loadPrototypes();
  }, [loadPrototypes]);

  const handleSearch = () => {
    setPage(1);
    loadPrototypes();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个原型吗？")) return;
    try {
      await agentPrototypeApi.delete(id);
      snackbar.success("删除成功");
      loadPrototypes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      snackbar.error(msg || "删除失败");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Agent 原型
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/agent-prototypes/new")}
          data-testid="btn-create-prototype"
        >
          新建原型
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          placeholder="搜索名称..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          size="small"
          sx={{ width: 300 }}
          data-testid="inp-search-prototype"
        />
        <TextField
          select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          size="small"
          sx={{ width: 150 }}
          data-testid="sel-filter-status"
        >
          <MenuItem value="">全部状态</MenuItem>
          <MenuItem value="draft">草稿</MenuItem>
          <MenuItem value="enabled">已启用</MenuItem>
          <MenuItem value="disabled">已禁用</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>版本</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>模型</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prototypes.map((prototype) => (
              <TableRow key={prototype.id} hover>
                <TableCell>{prototype.id}</TableCell>
                <TableCell>{prototype.name}</TableCell>
                <TableCell>{prototype.version}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[prototype.status]}
                    color={statusColors[prototype.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{prototype.model}</TableCell>
                <TableCell>
                  {new Date(prototype.created_at).toLocaleString("zh-CN")}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/agent-prototypes/${prototype.id}`)}
                      data-testid={`btn-detail-${prototype.id}`}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {prototype.status === "draft" && (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(prototype.id)}
                        data-testid={`btn-delete-${prototype.id}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {prototypes.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    暂无数据
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}