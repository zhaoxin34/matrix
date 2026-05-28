"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  OrgUnitTreeItem,
  EmployeeResponse,
  EmployeeStatus,
} from "@/types/organization";
import {
  getOrgUnitTree,
  createOrgUnit,
  updateOrgUnit,
  updateOrgUnitStatus,
  deleteOrgUnit,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  restoreEmployee,
} from "@/lib/api/organization";

import { DashboardStats } from "@/components/org-structure/dashboard-stats";
import { OrgTreePanel } from "@/components/org-structure/org-tree-panel";
import { EmployeePanel } from "@/components/org-structure/employee-panel";

export default function OrgStructurePage() {
  // Data state
  const [orgTree, setOrgTree] = useState<OrgUnitTreeItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [employeeTotal, setEmployeeTotal] = useState(0);

  // Loading state
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  // Selection
  const [selectedUnit, setSelectedUnit] = useState<OrgUnitTreeItem | null>(
    null,
  );

  // Org Dialog states
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgModalMode, setOrgModalMode] = useState<"create" | "edit">("create");
  const [editingOrgUnit, setEditingOrgUnit] = useState<OrgUnitTreeItem | null>(
    null,
  );
  const [orgFormData, setOrgFormData] = useState({ name: "", code: "" });

  const [deleteOrgConfirmOpen, setDeleteOrgConfirmOpen] = useState(false);
  const [deletingOrgUnit, setDeletingOrgUnit] =
    useState<OrgUnitTreeItem | null>(null);

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoadingTree(true);
      setIsLoadingEmployees(true);
      try {
        const [treeData, empData] = await Promise.all([
          getOrgUnitTree(),
          getEmployees({ page: 1, page_size: 10 }),
        ]);
        if (mounted) {
          setOrgTree(treeData);
          setEmployees(empData.list);
          setEmployeeTotal(empData.total);
        }
      } catch (err) {
        if (mounted) {
          toast.error("加载数据失败", {
            description:
              typeof err === "object" && err && "message" in err
                ? String(err.message)
                : String(err),
          });
        }
      } finally {
        if (mounted) {
          setIsLoadingTree(false);
          setIsLoadingEmployees(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Refresh employees
  const refreshEmployees = async (
    unitId?: number,
    showDeleted: boolean = false,
  ) => {
    try {
      const result = await getEmployees({
        page: 1,
        page_size: 10,
        unit_id: unitId,
        include_deleted: showDeleted,
      });
      setEmployees(result.list);
      setEmployeeTotal(result.total);
    } catch (err) {
      toast.error("获取员工列表失败", {
        description:
          typeof err === "object" && err && "message" in err
            ? String(err.message)
            : String(err),
      });
    }
  };

  // Handlers - Organization
  const handleSelectUnit = (node: OrgUnitTreeItem) => {
    setSelectedUnit(node);
    refreshEmployees(node.id);
  };

  const handleAddRootNode = () => {
    setOrgModalMode("create");
    setEditingOrgUnit(null);
    setOrgFormData({ name: "", code: "" });
    setOrgModalOpen(true);
  };

  const handleAddChild = (node: OrgUnitTreeItem) => {
    setOrgModalMode("create");
    setEditingOrgUnit(node);
    setOrgFormData({ name: "", code: "" });
    setOrgModalOpen(true);
  };

  const handleEditOrgUnit = (node: OrgUnitTreeItem) => {
    setOrgModalMode("edit");
    setEditingOrgUnit(node);
    setOrgFormData({ name: node.name, code: node.code });
    setOrgModalOpen(true);
  };

  const handleDeleteOrgUnit = (node: OrgUnitTreeItem) => {
    setDeletingOrgUnit(node);
    setDeleteOrgConfirmOpen(true);
  };

  const handleToggleOrgStatus = async (node: OrgUnitTreeItem) => {
    const newStatus = node.status === "active" ? "inactive" : "active";
    try {
      await updateOrgUnitStatus(node.id, { status: newStatus });
      const treeData = await getOrgUnitTree();
      setOrgTree(treeData);
    } catch (err) {
      toast.error("更新状态失败", {
        description:
          typeof err === "object" && err && "message" in err
            ? String(err.message)
            : String(err),
      });
    }
  };

  const handleOrgSubmit = async () => {
    try {
      if (orgModalMode === "create") {
        await createOrgUnit({
          name: orgFormData.name,
          code: orgFormData.code,
          type: "department",
          parent_id: editingOrgUnit?.id,
        });
      } else if (editingOrgUnit) {
        await updateOrgUnit(editingOrgUnit.id, {
          name: orgFormData.name,
        });
      }
      setOrgModalOpen(false);
      const treeData = await getOrgUnitTree();
      setOrgTree(treeData);
    } catch (err) {
      toast.error("保存组织失败", {
        description:
          typeof err === "object" && err && "message" in err
            ? String(err.message)
            : String(err),
      });
    }
  };

  const handleDeleteOrgConfirm = async () => {
    if (!deletingOrgUnit) return;
    try {
      await deleteOrgUnit(deletingOrgUnit.id);
      setDeleteOrgConfirmOpen(false);
      setDeletingOrgUnit(null);
      if (selectedUnit?.id === deletingOrgUnit.id) {
        setSelectedUnit(null);
      }
      const treeData = await getOrgUnitTree();
      setOrgTree(treeData);
    } catch (err) {
      toast.error("删除组织失败", {
        description:
          typeof err === "object" && err && "message" in err
            ? String(err.message)
            : String(err),
      });
    }
  };

  // Handlers - Employee
  const handleEmployeeCreate = async (data: {
    employee_no: string;
    name: string;
    email?: string;
    position?: string;
    primary_unit_id?: number;
    user_id: number;
  }) => {
    await createEmployee(data);
    // 刷新组织树（更新人数）
    const treeData = await getOrgUnitTree();
    setOrgTree(treeData);
    await refreshEmployees(selectedUnit?.id);
  };

  const handleEmployeeUpdate = async (
    id: number,
    data: {
      name: string;
      phone?: string;
      email?: string;
      position?: string;
      primary_unit_id?: number;
    },
  ) => {
    await updateEmployee(id, data);
    await refreshEmployees(selectedUnit?.id);
  };

  const handleEmployeeDelete = async (id: number) => {
    await deleteEmployee(id);
    await refreshEmployees(selectedUnit?.id);
    // 刷新组织树（更新人数）
    const treeData = await getOrgUnitTree();
    setOrgTree(treeData);
  };

  const handleStatusChange = async (id: number, status: EmployeeStatus) => {
    await updateEmployee(id, { status });
    await refreshEmployees(selectedUnit?.id);
  };

  const handleEmployeeRestore = async (id: number) => {
    await restoreEmployee(id);
    await refreshEmployees(selectedUnit?.id);
    // 刷新组织树（更新人数）
    const treeData = await getOrgUnitTree();
    setOrgTree(treeData);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted/30">
      {/* Dashboard Stats */}
      <DashboardStats
        orgTree={orgTree}
        employees={employees}
        total={employeeTotal}
      />

      {/* Main Content */}
      <div className="flex gap-4 flex-1">
        {/* Left Panel - Organization Tree */}
        <OrgTreePanel
          orgTree={orgTree}
          selectedId={selectedUnit?.id ?? null}
          isLoading={isLoadingTree}
          onSelect={handleSelectUnit}
          onAddChild={handleAddChild}
          onEdit={handleEditOrgUnit}
          onDelete={handleDeleteOrgUnit}
          onToggleStatus={handleToggleOrgStatus}
          onAddRoot={handleAddRootNode}
        />

        {/* Right Panel - Employee List */}
        <EmployeePanel
          selectedUnit={selectedUnit}
          employees={employees}
          total={employeeTotal}
          isLoading={isLoadingEmployees}
          onRefreshEmployees={(includeDeleted) =>
            refreshEmployees(selectedUnit?.id, includeDeleted)
          }
          onCreate={handleEmployeeCreate}
          onUpdate={handleEmployeeUpdate}
          onDelete={handleEmployeeDelete}
          onStatusChange={handleStatusChange}
          onRestore={handleEmployeeRestore}
        />
      </div>

      {/* Organization Modal */}
      <Dialog open={orgModalOpen} onOpenChange={setOrgModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {orgModalMode === "create" ? "新增组织" : "编辑组织"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">名称</Label>
              <Input
                id="org-name"
                data-testid="inp-org-name"
                value={orgFormData.name}
                onChange={(e) =>
                  setOrgFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="请输入组织名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-code">编码</Label>
              <Input
                id="org-code"
                data-testid="inp-org-code"
                value={orgFormData.code}
                onChange={(e) =>
                  setOrgFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="请输入组织编码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrgModalOpen(false)}>
              取消
            </Button>
            <Button data-testid="btn-org-submit" onClick={handleOrgSubmit}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Org Confirmation */}
      <Dialog
        open={deleteOrgConfirmOpen}
        onOpenChange={setDeleteOrgConfirmOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定删除组织「{deletingOrgUnit?.name}」吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOrgConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              data-testid="btn-confirm-delete-org"
              onClick={handleDeleteOrgConfirm}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
