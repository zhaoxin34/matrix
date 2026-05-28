import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  EmployeeResponse,
  EmployeeStatus,
  OrgUnitTreeItem,
  UnlinkedUser,
} from "@/types/organization";
import { UserSelector } from "@/components/user-selector";

import {
  getAvailableActions,
  getStatusLabel,
  type TransitionAction,
} from "./status-transition";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  LoaderIcon,
  MoreIcon,
  PlusIcon,
  RestoreIcon,
  SearchIcon,
  UploadIcon,
  UserIcon,
} from "./icons";

const pageSize = 10;

interface EmployeePanelProps {
  selectedUnit: OrgUnitTreeItem | null;
  employees: EmployeeResponse[];
  total: number;
  isLoading: boolean;
  onRefreshEmployees: (includeDeleted: boolean) => void;

  onCreate: (data: {
    employee_no: string;
    name: string;
    email?: string;
    position?: string;
    primary_unit_id?: number;
    user_id: number;
  }) => Promise<void>;
  onUpdate: (
    id: number,
    data: {
      name: string;
      phone?: string;
      email?: string;
      position?: string;
      primary_unit_id?: number;
    },
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onStatusChange: (id: number, status: EmployeeStatus) => Promise<void>;
  onRestore: (id: number) => Promise<void>;
}

export function EmployeePanel({
  selectedUnit,
  employees,
  total,
  isLoading,
  onRefreshEmployees,
  onCreate,
  onUpdate,
  onDelete,
  onStatusChange,
  onRestore,
}: EmployeePanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

  // Dialog states
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [empModalMode, setEmpModalMode] = useState<"create" | "edit">("create");
  const [userSelectorOpen, setUserSelectorOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeResponse | null>(null);
  const [empFormData, setEmpFormData] = useState({
    employee_no: "",
    name: "",
    phone: "",
    email: "",
    position: "",
    primary_unit_id: undefined as number | undefined,
    user_id: undefined as number | undefined,
    selected_user: null as UnlinkedUser | null,
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] =
    useState<EmployeeResponse | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  // Handlers
  const handleAddEmployee = () => {
    setEmpModalMode("create");
    setEditingEmployee(null);
    setEmpFormData({
      employee_no: "",
      name: "",
      phone: "",
      email: "",
      position: "",
      primary_unit_id: selectedUnit?.id,
      user_id: undefined,
      selected_user: null,
    });
    setUserSelectorOpen(true);
  };

  const handleEditEmployee = (emp: EmployeeResponse) => {
    setEmpModalMode("edit");
    setEditingEmployee(emp);
    setEmpFormData({
      employee_no: emp.employee_no,
      name: emp.name,
      phone: emp.phone || "",
      email: emp.email || "",
      position: emp.position || "",
      primary_unit_id: emp.primary_unit?.id,
      user_id: undefined,
      selected_user: null,
    });
    setEmpModalOpen(true);
  };

  const handleDeleteEmployee = (emp: EmployeeResponse) => {
    setDeletingEmployee(emp);
    setDeleteConfirmOpen(true);
  };

  const handleRestoreEmployee = async (emp: EmployeeResponse) => {
    try {
      await onRestore(emp.id);
      toast.success(`员工「${emp.name}」已恢复`);
    } catch (err) {
      toast.error("恢复失败", {
        description:
          typeof err === "object" && err && "message" in err
            ? String(err.message)
            : String(err),
      });
    }
  };

  const handleTabChange = (value: string) => {
    const newTab = value as "active" | "deleted";
    setActiveTab(newTab);
    setCurrentPage(1);
    // 调用父组件刷新员工列表
    onRefreshEmployees(newTab === "deleted");
  };

  const handleStatusTransition = async (
    emp: EmployeeResponse,
    action: TransitionAction,
  ) => {
    try {
      await onStatusChange(emp.id, action.targetStatus);
      toast.success(
        `${emp.name} 已变更为「${getStatusLabel(action.targetStatus)}」`,
      );
    } catch (err) {
      toast.error("状态更新失败", {
        description:
          typeof err === "object" && err && "message" in err
            ? String(err.message)
            : String(err),
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (empModalMode === "create") {
        if (!empFormData.user_id) {
          toast.error("请先选择用户");
          return;
        }
        await onCreate({
          employee_no: empFormData.employee_no,
          name: empFormData.name,
          email: empFormData.email || undefined,
          position: empFormData.position || undefined,
          primary_unit_id: empFormData.primary_unit_id,
          user_id: empFormData.user_id,
        });
      } else if (editingEmployee) {
        await onUpdate(editingEmployee.id, {
          name: empFormData.name,
          phone: empFormData.phone || undefined,
          email: empFormData.email || undefined,
          position: empFormData.position || undefined,
          primary_unit_id: empFormData.primary_unit_id,
        });
      }
      setEmpModalOpen(false);
    } catch (err) {
      toast.error("保存失败", {
        description:
          typeof err === "object" && err && "message" in err
            ? String(err.message)
            : String(err),
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    try {
      await onDelete(deletingEmployee.id);
      setDeleteConfirmOpen(false);
      setDeletingEmployee(null);
    } catch (err) {
      toast.error("删除失败", {
        description:
          typeof err === "object" && err && "message" in err
            ? String(err.message)
            : String(err),
      });
    }
  };

  return (
    <>
      <div className="flex-1 bg-card border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-semibold">
            员工列表{selectedUnit ? ` - ${selectedUnit.name}` : ""}
          </h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={!selectedUnit}>
              <UploadIcon className="h-4 w-4 mr-1" />
              导入
            </Button>
            <Button size="sm" variant="outline" disabled={!selectedUnit}>
              <DownloadIcon className="h-4 w-4 mr-1" />
              导出
            </Button>
            <Button
              size="sm"
              onClick={handleAddEmployee}
              disabled={!selectedUnit}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              添加员工
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* 未选择组织 */}
          {!selectedUnit ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              请先在左侧选择一个组织
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    data-testid="inp-employee-search"
                    placeholder="搜索姓名、工号、手机号..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-4">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList>
                    <TabsTrigger value="active">在职员工</TabsTrigger>
                    <TabsTrigger value="deleted">已删除员工</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Table */}
              <div className="border bg-card">
                <table className="w-full text-sm" data-testid="tbl-employees">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">工号</th>
                      <th className="px-4 py-3 text-left font-medium">姓名</th>
                      <th className="px-4 py-3 text-left font-medium">
                        手机号
                      </th>
                      <th className="px-4 py-3 text-left font-medium">邮箱</th>
                      <th className="px-4 py-3 text-left font-medium">职位</th>
                      <th className="px-4 py-3 text-left font-medium">状态</th>
                      <th className="px-4 py-3 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center">
                          <LoaderIcon className="h-6 w-6 mx-auto text-muted-foreground" />
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          暂无员工数据
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp, index) => (
                        <tr
                          key={emp.id}
                          className={cn(
                            "group border-b last:border-b-0 hover:bg-muted/30",
                            index % 2 === 1 && "bg-muted/30",
                          )}
                        >
                          <td className="px-4 py-3 font-mono">
                            {emp.employee_no}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10">
                                <UserIcon className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{emp.phone || "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {emp.email || "-"}
                          </td>
                          <td className="px-4 py-3">{emp.position || "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                emp.is_deleted
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800",
                              )}
                            >
                              {emp.is_deleted
                                ? "已删除"
                                : getStatusLabel(emp.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {/* Status Transition Dropdown */}
                              {!emp.is_deleted &&
                                getAvailableActions(emp.status).length > 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                                        <MoreIcon className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {getAvailableActions(emp.status).map(
                                        (action) => (
                                          <DropdownMenuItem
                                            key={action.key}
                                            onClick={() =>
                                              handleStatusTransition(
                                                emp,
                                                action,
                                              )
                                            }
                                          >
                                            {action.label}
                                          </DropdownMenuItem>
                                        ),
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              {/* Edit Button */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleEditEmployee(emp)}
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>编辑</TooltipContent>
                              </Tooltip>
                              {/* Delete/Restore Button */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() =>
                                      emp.is_deleted
                                        ? handleRestoreEmployee(emp)
                                        : handleDeleteEmployee(emp)
                                    }
                                    className={cn(
                                      emp.is_deleted &&
                                        "text-green-600 hover:text-green-700",
                                      !emp.is_deleted && "text-destructive",
                                    )}
                                  >
                                    {emp.is_deleted ? (
                                      <RestoreIcon className="h-4 w-4" />
                                    ) : (
                                      <DeleteIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {emp.is_deleted ? "恢复" : "删除"}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    显示 {(currentPage - 1) * pageSize + 1} -{" "}
                    {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      第 {currentPage} / {totalPages || 1} 页
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Employee Modal */}
      <Dialog open={empModalOpen} onOpenChange={setEmpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {empModalMode === "create" ? "添加员工" : "编辑员工"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* User Info - Display Only */}
            {empModalMode === "create" && empFormData.selected_user && (
              <div className="p-3 bg-muted/30 rounded-md space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  关联用户信息
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">手机号：</span>
                    <span>{empFormData.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">邮箱：</span>
                    <span>{empFormData.email || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">用户名：</span>
                    <span>{empFormData.name || "-"}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="emp-no">工号 *</Label>
              <Input
                id="emp-no"
                data-testid="inp-emp-no"
                value={empFormData.employee_no}
                onChange={(e) =>
                  setEmpFormData((prev) => ({
                    ...prev,
                    employee_no: e.target.value,
                  }))
                }
                placeholder="请输入工号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-position">职位</Label>
              <Input
                id="emp-position"
                data-testid="inp-emp-position"
                value={empFormData.position}
                onChange={(e) =>
                  setEmpFormData((prev) => ({
                    ...prev,
                    position: e.target.value,
                  }))
                }
                placeholder="请输入职位"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpModalOpen(false)}>
              取消
            </Button>
            <Button
              data-testid="btn-emp-submit"
              onClick={handleSubmit}
              disabled={empModalMode === "create" && !empFormData.selected_user}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Selector */}
      <UserSelector
        open={userSelectorOpen}
        onOpenChange={setUserSelectorOpen}
        onSelect={(user) => {
          setEmpFormData((prev) => ({
            ...prev,
            selected_user: user,
            user_id: user.id,
            name: user.username || "",
            phone: user.phone,
            email: user.email || prev.email,
          }));
          setEmpModalOpen(true);
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定删除员工「{deletingEmployee?.name}」吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              data-testid="btn-confirm-delete-emp"
              onClick={handleDeleteConfirm}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
