"use client";

import { useState, useEffect, useCallback } from "react";
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
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import EditIcon from "@mui/icons-material/Edit";
import ArchiveIcon from "@mui/icons-material/Archive";
import SearchIcon from "@mui/icons-material/Search";
import InboxIcon from "@mui/icons-material/Inbox";
import {
  projectApi,
  Project,
  ProjectCreate,
  ProjectUpdate,
} from "@/lib/projectApi";
import { useSnackbar } from "@/hooks/useSnackbar";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const snackbar = useSnackbar();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await projectApi.list({
        page: page + 1,
        page_size: rowsPerPage,
        keyword: searchKeyword || undefined,
      });
      setProjects(result.items || []);
    } catch (e) {
      console.error("Failed to fetch projects:", e);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchKeyword]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleAdd = () => {
    setModalMode("create");
    setEditingProject(null);
    setFormData({ name: "", code: "", description: "" });
    setModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setModalMode("edit");
    setEditingProject(project);
    setFormData({
      name: project.name,
      code: project.code,
      description: project.description || "",
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (project: Project) => {
    try {
      const newStatus = project.status === "active" ? "inactive" : "active";
      await projectApi.update(project.id, { status: newStatus });
      snackbar.success(newStatus === "active" ? "启用成功" : "禁用成功");
      fetchProjects();
    } catch (e) {
      console.error("Failed to toggle status:", e);
      snackbar.error("操作失败");
    }
  };

  const handleArchive = async (project: Project) => {
    try {
      await projectApi.update(project.id, { status: "archived" });
      snackbar.success("归档成功");
      fetchProjects();
    } catch (e) {
      console.error("Failed to archive:", e);
      snackbar.error("操作失败");
    }
  };

  const handleModalOk = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      snackbar.warning("请填写必填项");
      return;
    }

    try {
      if (modalMode === "create") {
        const data: ProjectCreate = {
          name: formData.name,
          code: formData.code,
          description: formData.description || undefined,
        };
        await projectApi.create(data);
        snackbar.success("创建成功");
      } else if (editingProject) {
        const data: ProjectUpdate = {
          name: formData.name,
          description: formData.description || undefined,
        };
        await projectApi.update(editingProject.id, data);
        snackbar.success("更新成功");
      }
      setModalOpen(false);
      fetchProjects();
    } catch (e) {
      console.error("Failed to save project:", e);
      const message = (e as Error).message;
      snackbar.error(message || "操作失败");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "活跃";
      case "inactive":
        return "禁用";
      case "archived":
        return "归档";
      default:
        return status;
    }
  };

  const displayProjects = projects;

  return (
    <Box
      sx={{
        p: 3,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        项目管理
      </Typography>

      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <TextField
          placeholder="搜索项目名称或代码"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          size="small"
          sx={{ width: 280 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          data-testid="btn-add-project"
        >
          新建项目
        </Button>
      </Box>

      <Card sx={{ flex: 1, overflow: "hidden" }}>
        <TableContainer sx={{ height: "100%" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>项目名称</TableCell>
                <TableCell>项目代码</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
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
              ) : displayProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <InboxIcon sx={{ fontSize: 64, color: "text.disabled" }} />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ mt: 2 }}
                    >
                      暂无项目
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      sx={{ mt: 1 }}
                    >
                      点击「新建项目」创建第一个项目
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayProjects
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((project) => (
                    <TableRow key={project.id} hover>
                      <TableCell>{project.id}</TableCell>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.code}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={project.description || ""}
                      >
                        {project.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(project.status)}
                          color={
                            getStatusColor(project.status) as
                              | "success"
                              | "warning"
                              | "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(project.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(project)}
                            data-testid={`btn-edit-project-${project.id}`}
                            aria-label={`编辑项目 ${project.name}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <Switch
                            size="small"
                            checked={project.status === "active"}
                            disabled={project.status === "archived"}
                            onChange={() => handleToggleStatus(project)}
                            data-testid={`switch-status-project-${project.id}`}
                            slotProps={{
                              input: {
                                "aria-label": `切换项目 ${project.name} 状态`,
                              },
                            }}
                          />
                          <IconButton
                            size="small"
                            disabled={project.status !== "inactive"}
                            onClick={() => handleArchive(project)}
                            data-testid={`btn-archive-project-${project.id}`}
                            aria-label={`归档项目 ${project.name}`}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </Box>
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
          count={displayProjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="每页行数"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} / ${count}`
          }
        />
      </Card>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {modalMode === "create" ? "新建项目" : "编辑项目"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="项目名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            data-testid="inp-project-name"
          />
          <TextField
            fullWidth
            label="项目代码"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            margin="normal"
            required
            disabled={modalMode === "edit"}
            data-testid="inp-project-code"
          />
          <TextField
            fullWidth
            label="描述"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            data-testid="inp-project-description"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={handleModalOk} variant="contained">
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
