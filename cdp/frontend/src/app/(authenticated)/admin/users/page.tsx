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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { userAdminApi, AdminUserItem } from "@/lib/userAdminApi";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useConfirmDialog } from "@/components/ConfirmDialog";

interface UserModalProps {
  visible: boolean;
  mode: "create" | "edit";
  user: AdminUserItem | null;
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (
    message: string,
    severity?: "success" | "error" | "warning" | "info",
  ) => void;
}

function UserModal({
  visible,
  mode,
  user,
  onClose,
  onSuccess,
  onNotify,
}: UserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    email: "",
    password: "",
    is_admin: false,
  });

  // Sync formData when modal opens with user data for edit mode
  useEffect(() => {
    if (!visible) return;
    if (mode === "edit" && user) {
      setFormData({
        username: user.username,
        phone: user.phone || "",
        email: user.email || "",
        password: "",
        is_admin: user.is_admin,
      });
    } else {
      setFormData({
        username: "",
        phone: "",
        email: "",
        password: "",
        is_admin: false,
      });
    }
  }, [visible, mode, user]);

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.phone.trim()) {
      onNotify("请填写必填项", "warning");
      return;
    }
    if (mode === "create" && !formData.password.trim()) {
      onNotify("请填写密码", "warning");
      return;
    }

    try {
      if (mode === "create") {
        await userAdminApi.createUser({
          username: formData.username,
          phone: formData.phone,
          email: formData.email || undefined,
          password: formData.password,
          is_admin: formData.is_admin,
        });
        onNotify("创建成功", "success");
      } else {
        await userAdminApi.updateUser(user!.id, {
          username: formData.username,
          phone: formData.phone,
          email: formData.email || undefined,
          is_admin: formData.is_admin,
        });
        onNotify("更新成功", "success");
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      onNotify(error?.response?.data?.message || "操作失败", "error");
    }
  };

  return (
    <Dialog open={visible} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === "create" ? "新建用户" : "编辑用户"}</DialogTitle>
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
          data-testid="inp-user-username"
        />
        <TextField
          fullWidth
          label="手机号"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          margin="normal"
          required
          data-testid="inp-user-phone"
        />
        <TextField
          fullWidth
          label="邮箱"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          margin="normal"
          data-testid="inp-user-email"
        />
        {mode === "create" && (
          <TextField
            fullWidth
            label="密码"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-user-password"
          />
        )}
        <FormControlLabel
          control={
            <Switch
              checked={formData.is_admin}
              onChange={(e) =>
                setFormData({ ...formData, is_admin: e.target.checked })
              }
            />
          }
          label="管理员"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained">
          {mode === "create" ? "创建" : "保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UserManagementPage() {
  const [data, setData] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);

  const snackbar = useSnackbar();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleNotify: UserModalProps["onNotify"] = (
    message,
    severity = "success",
  ) => {
    if (severity === "success") snackbar.success(message);
    else if (severity === "error") snackbar.error(message);
    else snackbar.warning(message);
  };

  const fetchData = useCallback(async () => {
    try {
      const result = await userAdminApi.listUsers(page + 1, rowsPerPage);
      setData(result.items);
      setTotal(result.total);
    } catch {
      snackbar.error("获取用户列表失败");
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setModalMode("create");
    setEditingUser(null);
    setModalVisible(true);
  };

  const handleEdit = (user: AdminUserItem) => {
    setModalMode("edit");
    setEditingUser(user);
    setModalVisible(true);
  };

  const handleDelete = async (userId: number) => {
    if (!(await confirm("删除用户", "确定删除该用户？"))) return;
    try {
      await userAdminApi.deleteUser(userId);
      snackbar.success("删除成功");
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      snackbar.error(error?.response?.data?.message || "删除失败");
    }
  };

  const formatDate = (dateStr: string) => dateStr?.split("T")[0] || "-";

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
            onClick={handleCreate}
            data-testid="btn-create-user"
          >
            新建用户
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>用户名</TableCell>
                <TableCell>手机号</TableCell>
                <TableCell>邮箱</TableCell>
                <TableCell>管理员</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>更新时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_admin ? "是" : "否"}
                        color={user.is_admin ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.updated_at)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="编辑">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(user)}
                            data-testid={`btn-edit-user-${user.id}`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(user.id)}
                            data-testid={`btn-delete-user-${user.id}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

      <UserModal
        visible={modalVisible}
        mode={modalMode}
        user={editingUser}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchData}
        onNotify={handleNotify}
      />
      <ConfirmDialog />
    </Box>
  );
}
