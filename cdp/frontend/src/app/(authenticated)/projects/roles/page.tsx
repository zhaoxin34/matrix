"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";

interface ProjectRole {
  id: number;
  name: string;
  code: string;
  description: string;
  member_count: number;
  created_at: string;
}

const mockRoles: ProjectRole[] = [
  {
    id: 1,
    name: "项目管理员",
    code: "admin",
    description: "项目全部权限",
    member_count: 2,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "开发者",
    code: "developer",
    description: "开发权限",
    member_count: 5,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 3,
    name: "访客",
    code: "viewer",
    description: "只读权限",
    member_count: 3,
    created_at: "2024-01-15T10:00:00Z",
  },
];

export default function ProjectRolesPage() {
  const [roles, setRoles] = useState<ProjectRole[]>(mockRoles);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRole, setEditingRole] = useState<ProjectRole | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  const handleAdd = () => {
    setModalMode("create");
    setEditingRole(null);
    setFormData({ name: "", code: "", description: "" });
    setModalOpen(true);
  };

  const handleEdit = (role: ProjectRole) => {
    setModalMode("edit");
    setEditingRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("确定删除该角色？")) return;
    setRoles((prev) => prev.filter((r) => r.id !== id));
    alert("删除成功");
  };

  const handleModalOk = () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert("请填写必填项");
      return;
    }
    if (modalMode === "create") {
      const newRole: ProjectRole = {
        id: Math.max(...roles.map((r) => r.id)) + 1,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        member_count: 0,
        created_at: new Date().toISOString(),
      };
      setRoles((prev) => [...prev, newRole]);
      alert("创建成功");
    } else if (editingRole) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole.id
            ? {
                ...r,
                name: formData.name,
                code: formData.code,
                description: formData.description,
              }
            : r,
        ),
      );
      alert("更新成功");
    }
    setModalOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">项目角色管理</Typography>
          <Button
            variant="contained"
            onClick={handleAdd}
            data-testid="btn-create-role"
          >
            新建角色
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>角色名称</TableCell>
                <TableCell>角色代码</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>成员数</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>{role.id}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <Chip label={role.code} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.member_count}</TableCell>
                  <TableCell>{role.created_at.split("T")[0]}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button
                        size="small"
                        onClick={() => handleEdit(role)}
                        data-testid={`btn-edit-role-${role.id}`}
                      >
                        编辑
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(role.id)}
                        data-testid={`btn-delete-role-${role.id}`}
                      >
                        删除
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {modalMode === "create" ? "新建角色" : "编辑角色"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="角色名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            data-testid="inp-role-name"
          />
          <TextField
            fullWidth
            label="角色代码"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            margin="normal"
            required
            data-testid="inp-role-code"
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
            rows={2}
            data-testid="inp-role-description"
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
