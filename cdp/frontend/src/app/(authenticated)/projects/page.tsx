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
import {
  projectApi,
  Project,
  ProjectCreate,
  ProjectUpdate,
} from "@/lib/projectApi";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
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

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await projectApi.list({
        page: page + 1,
        page_size: rowsPerPage,
        keyword: searchKeyword || undefined,
      });
      setProjects(result.items || []);
      setTotal(result.total || 0);
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
      alert(newStatus === "active" ? "启用成功" : "禁用成功");
      fetchProjects();
    } catch (e) {
      console.error("Failed to toggle status:", e);
      alert("操作失败");
    }
  };

  const handleArchive = async (project: Project) => {
    try {
      await projectApi.update(project.id, { status: "archived" });
      alert("归档成功");
      fetchProjects();
    } catch (e) {
      console.error("Failed to archive:", e);
      alert("操作失败");
    }
  };

  const handleModalOk = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert("请填写必填项");
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
        alert("创建成功");
      } else if (editingProject) {
        const data: ProjectUpdate = {
          name: formData.name,
          description: formData.description || undefined,
        };
        await projectApi.update(editingProject.id, data);
        alert("更新成功");
      }
      setModalOpen(false);
      fetchProjects();
    } catch (e) {
      console.error("Failed to save project:", e);
      alert("操作失败");
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

  const filteredProjects = projects.filter(
    (p) => p.name.includes(searchKeyword) || p.code.includes(searchKeyword),
  );

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
          sx={{ width: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">🔍</InputAdornment>
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
              {filteredProjects
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
                      }}
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
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(project)}
                          data-testid={`btn-edit-project-${project.id}`}
                        >
                          ✏️
                        </IconButton>
                        <Switch
                          size="small"
                          checked={project.status === "active"}
                          disabled={project.status === "archived"}
                          onChange={() => handleToggleStatus(project)}
                          data-testid={`switch-status-project-${project.id}`}
                        />
                        <IconButton
                          size="small"
                          disabled={project.status !== "inactive"}
                          onClick={() => handleArchive(project)}
                          data-testid={`btn-archive-project-${project.id}`}
                        >
                          📦
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 20, 50]}
          component="div"
          count={filteredProjects.length}
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
