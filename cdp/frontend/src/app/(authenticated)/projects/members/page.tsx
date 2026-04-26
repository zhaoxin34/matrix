"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useConfirmDialog } from "@/components/ConfirmDialog";

interface ProjectMember {
  id: number;
  user_id: number;
  username: string;
  phone: string | null;
  role: "admin" | "member";
  created_at: string;
}

const mockMembers: ProjectMember[] = [
  {
    id: 1,
    user_id: 1,
    username: "张三",
    phone: "13800138001",
    role: "admin",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    user_id: 2,
    username: "李四",
    phone: "13800138002",
    role: "member",
    created_at: "2024-01-16T10:00:00Z",
  },
  {
    id: 3,
    user_id: 3,
    username: "王五",
    phone: "13800138003",
    role: "member",
    created_at: "2024-01-17T10:00:00Z",
  },
];

export default function ProjectMembersPage() {
  const [members, setMembers] = useState<ProjectMember[]>(mockMembers);
  const [total, setTotal] = useState(mockMembers.length);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(
    null,
  );
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    role: "member" as "admin" | "member",
  });
  const snackbar = useSnackbar();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleAdd = () => {
    setModalMode("add");
    setEditingMember(null);
    setFormData({ username: "", phone: "", role: "member" });
    setModalOpen(true);
  };

  const handleEdit = (member: ProjectMember) => {
    setModalMode("edit");
    setEditingMember(member);
    setFormData({
      username: member.username,
      phone: member.phone || "",
      role: member.role,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm("删除成员", "确定删除该成员？"))) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    snackbar.success("删除成功");
  };

  const handleModalOk = () => {
    if (!formData.username.trim()) {
      snackbar.warning("请填写用户名");
      return;
    }
    if (modalMode === "add") {
      const newMember: ProjectMember = {
        id: Math.max(...members.map((m) => m.id)) + 1,
        user_id: Math.max(...members.map((m) => m.user_id)) + 1,
        username: formData.username,
        phone: formData.phone || null,
        role: formData.role,
        created_at: new Date().toISOString(),
      };
      setMembers((prev) => [...prev, newMember]);
      snackbar.success("添加成功");
    } else if (editingMember) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                username: formData.username,
                phone: formData.phone || null,
                role: formData.role,
              }
            : m,
        ),
      );
      snackbar.success("更新成功");
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
          <Button
            variant="contained"
            onClick={handleAdd}
            data-testid="btn-add-member"
          >
            添加成员
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>用户名</TableCell>
                <TableCell>手机号</TableCell>
                <TableCell>角色</TableCell>
                <TableCell>加入时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>{member.id}</TableCell>
                    <TableCell>{member.username}</TableCell>
                    <TableCell>{member.phone || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.role === "admin" ? "管理员" : "成员"}
                        color={member.role === "admin" ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{member.created_at.split("T")[0]}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Button
                          size="small"
                          onClick={() => handleEdit(member)}
                          data-testid={`btn-edit-member-${member.id}`}
                        >
                          编辑
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(member.id)}
                          data-testid={`btn-delete-member-${member.id}`}
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

        <TablePagination
          rowsPerPageOptions={[5, 10, 20]}
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

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {modalMode === "add" ? "添加成员" : "编辑成员"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="用户名"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-member-username"
          />
          <TextField
            fullWidth
            label="手机号"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            margin="normal"
            data-testid="inp-member-phone"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>角色</InputLabel>
            <Select
              value={formData.role}
              label="角色"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "admin" | "member",
                })
              }
            >
              <MenuItem value="admin">管理员</MenuItem>
              <MenuItem value="member">成员</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={handleModalOk} variant="contained">
            确定
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog />
    </Box>
  );
}
