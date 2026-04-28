"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import type { AgentPrototype } from "@/lib/agentPrototypeApi";
import { agentPrototypeApi } from "@/lib/agentPrototypeApi";
import ConfirmDialog from "@/components/agent-prototype/ConfirmDialog";

const STATUS_COLORS: Record<string, "default" | "success" | "warning"> = {
  draft: "default",
  enabled: "success",
  disabled: "warning",
};

export default function AgentPrototypesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prototypes, setPrototypes] = useState<AgentPrototype[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agentPrototypeApi.list({
        page: page + 1,
        page_size: pageSize,
        status: status || undefined,
        keyword: keyword || undefined,
      });
      setPrototypes(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取列表失败");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchList(); }, [page, pageSize, status, keyword]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await agentPrototypeApi.delete(deleteId);
      setDeleteId(null);
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Agent 原型</Typography>
        <Button
          variant="contained"
          onClick={() => router.push("/agent-prototypes/new")}
          data-testid="btn-create-prototype"
        >
          新建原型
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="搜索名称或描述"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          data-testid="inp-search-prototype"
          sx={{ width: 250 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>状态</InputLabel>
          <Select
            value={status}
            label="状态"
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            data-testid="sel-filter-status"
          >
            <MenuItem value="">全部状态</MenuItem>
            <MenuItem value="draft">草稿</MenuItem>
            <MenuItem value="enabled">已启用</MenuItem>
            <MenuItem value="disabled">已禁用</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>名称</TableCell>
                <TableCell>版本</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>模型</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prototypes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>{p.name}</Typography>
                    {p.description && (
                      <Typography variant="caption" color="text.secondary" component="div">{p.description}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" component="span" sx={{ fontFamily: "monospace" }}>
                      {p.version}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.status === "draft" ? "草稿" : p.status === "enabled" ? "已启用" : "已禁用"}
                      color={STATUS_COLORS[p.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.model}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(p.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="详情">
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/agent-prototypes/${p.id}`)}
                        data-testid={`btn-detail-${p.id}`}
                      >
                        👁
                      </IconButton>
                    </Tooltip>
                    {p.status === "draft" && (
                      <Tooltip title="删除">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteId(p.id)}
                          data-testid={`btn-delete-${p.id}`}
                        >
                          🗑
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {prototypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" component="div" sx={{ py: 4 }}>暂无数据</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(0); }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="确认删除"
        message="确定要删除这个原型吗？删除后将无法恢复。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        dataTestid="dlg-delete"
      />
    </Box>
  );
}
