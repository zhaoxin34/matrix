"use client";

import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
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
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import { orgApi, OrgUnitTreeNode, Employee, OrgUnitType } from "@/lib/orgApi";
import { useSnackbar } from "@/hooks/useSnackbar";

interface TreeNodeProps {
  node: OrgUnitTreeNode;
  selectedId: number | null;
  onSelect: (node: OrgUnitTreeNode) => void;
  onAddChild: (parentId: number) => void;
  onEdit: (node: OrgUnitTreeNode) => void;
  onDelete: (node: OrgUnitTreeNode) => void;
  onToggleStatus: (node: OrgUnitTreeNode) => void;
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  onToggleStatus,
}: TreeNodeProps) {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const hasChildren = node.children.length > 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setAnchorEl(e.currentTarget as HTMLElement);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <ListItemButton
        onClick={() => {
          onSelect(node);
          if (hasChildren) setOpen(!open);
        }}
        onContextMenu={handleContextMenu}
        selected={selectedId === node.id}
        sx={{ pl: 2 }}
      >
        {hasChildren ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? "▼" : "▶"}
          </IconButton>
        ) : (
          <Box sx={{ width: 24 }} />
        )}
        <ListItemText
          primary={node.name}
          secondary={`${node.member_count}人`}
        />
      </ListItemButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            onAddChild(node.id);
            handleClose();
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          添加子节点
        </MenuItem>
        <MenuItem
          onClick={() => {
            onEdit(node);
            handleClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          编辑
        </MenuItem>
        <MenuItem
          onClick={() => {
            onToggleStatus(node);
            handleClose();
          }}
        >
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          {node.status === "active" ? "禁用" : "启用"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete(node);
            handleClose();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          删除
        </MenuItem>
      </Menu>
      {hasChildren && (
        <Collapse in={open}>
          <List disablePadding>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

export default function OrgStructurePage() {
  const [orgTree, setOrgTree] = useState<OrgUnitTreeNode[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<OrgUnitTreeNode | null>(
    null,
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const snackbar = useSnackbar();

  // Dashboard stats
  const [dashboardData, setDashboardData] = useState({
    total: 0,
    on_job: 0,
    onboarding: 0,
    org_count: 0,
  });

  // Modal states
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgModalMode, setOrgModalMode] = useState<"create" | "edit">("create");
  const [orgModalParentId, setOrgModalParentId] = useState<number | null>(null);
  const [editingOrgUnit, setEditingOrgUnit] = useState<OrgUnitTreeNode | null>(
    null,
  );
  const [orgFormData, setOrgFormData] = useState<{
    name: string;
    code: string;
    type: string;
  }>({ name: "", code: "", type: "department" });

  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [empModalMode, setEmpModalMode] = useState<"create" | "edit">("create");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empFormData, setEmpFormData] = useState({
    employee_no: "",
    name: "",
    phone: "",
    email: "",
    position: "",
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<OrgUnitTreeNode | null>(
    null,
  );

  const fetchOrgTree = useCallback(async () => {
    try {
      const data = await orgApi.getTree();
      if (!data) {
        setOrgTree([]);
        return;
      }
      setOrgTree(data);
      // Calculate dashboard stats
      let total = 0;
      let orgCount = 0;
      const countNodes = (nodes: OrgUnitTreeNode[]) => {
        nodes?.forEach((node) => {
          total += node.member_count;
          orgCount++;
          if (node.children?.length > 0) countNodes(node.children);
        });
      };
      countNodes(data);
      setDashboardData((prev) => ({ ...prev, total, org_count: orgCount }));
    } catch (e) {
      console.error("Failed to fetch org tree:", e);
      setOrgTree([]);
    }
  }, []);

  const fetchEmployees = useCallback(async (unitId?: number) => {
    try {
      const data = await orgApi.getEmployees(unitId);
      // Ensure data is always an array
      const employeesArray = Array.isArray(data) ? data : [];
      setEmployees(employeesArray);
      // Update on_job count from employees
      const onJobCount = employeesArray.filter(
        (e) => e.status === "on_job",
      ).length;
      const onboardingCount = employeesArray.filter(
        (e) => e.status === "onboarding",
      ).length;
      setDashboardData((prev) => ({
        ...prev,
        on_job: onJobCount,
        onboarding: onboardingCount,
      }));
    } catch (e) {
      console.error("Failed to fetch employees:", e);
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    fetchOrgTree();
    fetchEmployees();
  }, [fetchOrgTree, fetchEmployees]);

  const handleSelectUnit = (node: OrgUnitTreeNode) => {
    setSelectedUnit(node);
    fetchEmployees(node.id);
  };

  const handleAddRootNode = () => {
    setOrgModalMode("create");
    setOrgModalParentId(null);
    setOrgFormData({ name: "", code: "", type: "company" });
    setEditingOrgUnit(null);
    setOrgModalOpen(true);
  };

  const handleAddChild = (parentId: number) => {
    setOrgModalMode("create");
    setOrgModalParentId(parentId);
    setOrgFormData({ name: "", code: "", type: "department" });
    setEditingOrgUnit(null);
    setOrgModalOpen(true);
  };

  const handleEditOrgUnit = (node: OrgUnitTreeNode) => {
    setOrgModalMode("edit");
    setEditingOrgUnit(node);
    setOrgFormData({
      name: node.name,
      code: node.code,
      type: node.type as OrgUnitType,
    });
    setOrgModalOpen(true);
  };

  const handleDeleteOrgUnit = (node: OrgUnitTreeNode) => {
    setDeletingUnit(node);
    setDeleteConfirmOpen(true);
  };

  const handleToggleStatus = async (node: OrgUnitTreeNode) => {
    try {
      await fetch(`/api/org-units/${node.id}/toggle-status`, {
        method: "POST",
      });
      fetchOrgTree();
    } catch (e) {
      console.error("Failed to toggle status:", e);
    }
  };

  const handleOrgModalOk = async () => {
    try {
      if (orgModalMode === "create") {
        await fetch("/api/org-units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...orgFormData, parent_id: orgModalParentId }),
        });
      } else {
        await fetch(`/api/org-units/${editingOrgUnit!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orgFormData),
        });
      }
      setOrgModalOpen(false);
      fetchOrgTree();
    } catch (e) {
      console.error("Failed to save org unit:", e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUnit) return;
    try {
      await fetch(`/api/org-units/${deletingUnit.id}`, { method: "DELETE" });
      setDeleteConfirmOpen(false);
      setDeletingUnit(null);
      if (selectedUnit?.id === deletingUnit.id) setSelectedUnit(null);
      fetchOrgTree();
    } catch (e) {
      console.error("Failed to delete org unit:", e);
    }
  };

  const handleAddEmployee = () => {
    setEmpModalMode("create");
    setEmpFormData({
      employee_no: "",
      name: "",
      phone: "",
      email: "",
      position: "",
    });
    setEditingEmployee(null);
    setEmpModalOpen(true);
  };

  const handleEditEmployee = (emp: Employee) => {
    setEmpModalMode("edit");
    setEditingEmployee(emp);
    setEmpFormData({
      employee_no: emp.employee_no,
      name: emp.name,
      phone: emp.phone || "",
      email: emp.email || "",
      position: emp.position || "",
    });
    setEmpModalOpen(true);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("确定删除该员工？")) return;
    try {
      await orgApi.deleteEmployee(id);
      fetchEmployees(selectedUnit?.id);
    } catch (e) {
      console.error("Failed to delete employee:", e);
    }
  };

  const handleEmpModalOk = async () => {
    if (!empFormData.name.trim()) {
      snackbar.warning("请填写员工姓名");
      return;
    }
    try {
      if (empModalMode === "create") {
        await orgApi.createEmployee({
          ...empFormData,
          primary_unit_id: selectedUnit?.id,
        });
      } else {
        await fetch(`/api/employees/${editingEmployee!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(empFormData),
        });
      }
      setEmpModalOpen(false);
      fetchEmployees(selectedUnit?.id);
    } catch (e) {
      console.error("Failed to save employee:", e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_job":
        return "success";
      case "onboarding":
        return "info";
      case "transferring":
        return "warning";
      case "offboarding":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on_job":
        return "在职";
      case "onboarding":
        return "入职中";
      case "transferring":
        return "调动中";
      case "offboarding":
        return "离职";
      default:
        return status;
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: "bold" }}>
        组织架构
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              {dashboardData.org_count}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              组织单元
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              {dashboardData.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              员工总数
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="info.main">
              {dashboardData.on_job}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              在职
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="warning.main">
              {dashboardData.onboarding}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              入职中
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <Box
          sx={{
            width: 280,
            borderRight: 1,
            borderColor: "divider",
            overflow: "auto",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2">组织结构</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddRootNode}
              data-testid="btn-add-root-org"
            >
              新增
            </Button>
          </Box>
          <List disablePadding>
            {orgTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                selectedId={selectedUnit?.id ?? null}
                onSelect={handleSelectUnit}
                onAddChild={handleAddChild}
                onEdit={handleEditOrgUnit}
                onDelete={handleDeleteOrgUnit}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </List>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle2">
              员工列表{selectedUnit ? ` - ${selectedUnit.name}` : ""}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddEmployee}
              data-testid="btn-add-employee"
            >
              添加员工
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>工号</TableCell>
                  <TableCell>姓名</TableCell>
                  <TableCell>手机号</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>职位</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} hover>
                    <TableCell>{emp.employee_no}</TableCell>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.phone || "-"}</TableCell>
                    <TableCell>{emp.email || "-"}</TableCell>
                    <TableCell>{emp.position || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(emp.status)}
                        color={
                          getStatusColor(emp.status) as
                            | "success"
                            | "info"
                            | "warning"
                            | "error"
                            | "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditEmployee(emp)}
                        data-testid={`btn-edit-employee-${emp.id}`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEmployee(emp.id)}
                        data-testid={`btn-delete-employee-${emp.id}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>

      {/* Org Unit Modal */}
      <Dialog
        open={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {orgModalMode === "create" ? "新增组织" : "编辑组织"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="名称"
            value={orgFormData.name}
            onChange={(e) =>
              setOrgFormData({ ...orgFormData, name: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-org-name"
          />
          <TextField
            fullWidth
            label="编码"
            value={orgFormData.code}
            onChange={(e) =>
              setOrgFormData({ ...orgFormData, code: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-org-code"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOrgModalOpen(false)}
            data-testid="btn-org-modal-cancel"
          >
            取消
          </Button>
          <Button
            onClick={handleOrgModalOk}
            variant="contained"
            data-testid="btn-org-modal-confirm"
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Modal */}
      <Dialog
        open={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {empModalMode === "create" ? "添加员工" : "编辑员工"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="工号"
            value={empFormData.employee_no}
            onChange={(e) =>
              setEmpFormData({ ...empFormData, employee_no: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-emp-no"
          />
          <TextField
            fullWidth
            label="姓名"
            value={empFormData.name}
            onChange={(e) =>
              setEmpFormData({ ...empFormData, name: e.target.value })
            }
            margin="normal"
            required
            data-testid="inp-emp-name"
          />
          <TextField
            fullWidth
            label="手机号"
            value={empFormData.phone}
            onChange={(e) =>
              setEmpFormData({ ...empFormData, phone: e.target.value })
            }
            margin="normal"
            data-testid="inp-emp-phone"
          />
          <TextField
            fullWidth
            label="邮箱"
            value={empFormData.email}
            onChange={(e) =>
              setEmpFormData({ ...empFormData, email: e.target.value })
            }
            margin="normal"
            data-testid="inp-emp-email"
          />
          <TextField
            fullWidth
            label="职位"
            value={empFormData.position}
            onChange={(e) =>
              setEmpFormData({ ...empFormData, position: e.target.value })
            }
            margin="normal"
            data-testid="inp-emp-position"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEmpModalOpen(false)}
            data-testid="btn-emp-modal-cancel"
          >
            取消
          </Button>
          <Button
            onClick={handleEmpModalOk}
            variant="contained"
            data-testid="btn-emp-modal-confirm"
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定删除组织&quot;{deletingUnit?.name}&quot;吗？此操作不可恢复。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            data-testid="btn-delete-confirm-cancel"
          >
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            data-testid="btn-delete-confirm-ok"
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
