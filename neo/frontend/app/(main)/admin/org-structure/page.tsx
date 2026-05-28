"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
	OrgUnitTreeItem,
	EmployeeResponse,
	EmployeeStatus,
	UnlinkedUser,
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
} from "@/lib/api/organization";
import { UserSelector } from "@/components/user-selector";

// ==================== Status Transition Config ====================
type TransitionAction = {
	key: string;
	label: string;
	targetStatus: EmployeeStatus;
};

const statusLabels: Record<EmployeeStatus, string> = {
	onboarding: "入职中",
	on_job: "在职",
	transferring: "调动中",
	offboarding: "离职",
};

const transitionMap: Record<EmployeeStatus, TransitionAction[]> = {
	onboarding: [{ key: "complete", label: "完成入职", targetStatus: "on_job" }],
	on_job: [
		{ key: "transfer", label: "发起调动", targetStatus: "transferring" },
		{ key: "offboard", label: "发起离职", targetStatus: "offboarding" },
	],
	transferring: [
		{ key: "complete_transfer", label: "完成调动", targetStatus: "on_job" },
		{ key: "cancel_transfer", label: "取消调动", targetStatus: "on_job" },
	],
	offboarding: [
		{ key: "rejoin", label: "重新入职", targetStatus: "onboarding" },
	],
};

function getAvailableActions(status: EmployeeStatus): TransitionAction[] {
	return transitionMap[status] || [];
}

function getStatusLabel(status: EmployeeStatus): string {
	return statusLabels[status] || status;
}

// ==================== Icon Components ====================
function PlusIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M5 12h14" />
			<path d="M12 5v14" />
		</svg>
	);
}

function SearchIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.3-4.3" />
		</svg>
	);
}

function UserIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	);
}

function EditIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
			<path d="m15 5 4 4" />
		</svg>
	);
}

function DeleteIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M3 6h18" />
			<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
			<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
		</svg>
	);
}

function BlockIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M4.93 4.93 19.07 19.07" />
		</svg>
	);
}

function MoreIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="1" />
			<circle cx="12" cy="5" r="1" />
			<circle cx="12" cy="19" r="1" />
		</svg>
	);
}

function ChevronDownIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

function ChevronRightIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m9 18 6-6-6-6" />
		</svg>
	);
}

function BuildingIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
			<path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
			<path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
			<path d="M10 6h4" />
			<path d="M10 10h4" />
			<path d="M10 14h4" />
			<path d="M10 18h4" />
		</svg>
	);
}

function GroupIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	);
}

function CheckCircleIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	);
}

function HourglassIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M5 22h14" />
			<path d="M5 2h14" />
			<path d="M17 22h2a2 2 0 0 0 2-2V7.5L17 2H7L5 7.5V20a2 2 0 0 0 2 2h2" />
			<path d="M9 22h6" />
			<path d="M12 2v6.5" />
		</svg>
	);
}

function ApartmentIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
			<path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
			<path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
			<path d="M10 6h4" />
			<path d="M10 10h4" />
			<path d="M10 14h4" />
			<path d="M10 18h4" />
		</svg>
	);
}

function ChevronLeftIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m15 18-6-6 6-6" />
		</svg>
	);
}

function UploadIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="17 8 12 3 7 8" />
			<line x1="12" x2="12" y1="3" y2="15" />
		</svg>
	);
}

function DownloadIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="7 10 12 15 17 10" />
			<line x1="12" x2="12" y1="15" y2="3" />
		</svg>
	);
}

function LoaderIcon({ className }: { className?: string }) {
	return (
		<svg
			className={cn("animate-spin", className)}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</svg>
	);
}

// ==================== Components ====================

// Organization Tree Node Component
function OrgTreeNode({
	node,
	selectedId,
	onSelect,
	onAddChild,
	onEdit,
	onDelete,
	onToggleStatus,
}: {
	node: OrgUnitTreeItem;
	selectedId: number | null;
	onSelect: (node: OrgUnitTreeItem) => void;
	onAddChild: (node: OrgUnitTreeItem) => void;
	onEdit: (node: OrgUnitTreeItem) => void;
	onDelete: (node: OrgUnitTreeItem) => void;
	onToggleStatus: (node: OrgUnitTreeItem) => void;
}) {
	const [isOpen, setIsOpen] = useState(true);
	const hasChildren = node.children.length > 0;
	const isSelected = selectedId === node.id;

	return (
		<div className="group">
			<div
				className={cn(
					"flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent transition-colors",
					isSelected && "bg-primary text-primary-foreground",
				)}
				onClick={() => {
					onSelect(node);
					if (hasChildren) setIsOpen(!isOpen);
				}}
			>
				<div className="w-5 flex items-center justify-center flex-shrink-0">
					{hasChildren ? (
						<button
							onClick={(e) => {
								e.stopPropagation();
								setIsOpen(!isOpen);
							}}
							className="p-0.5 hover:bg-accent rounded"
						>
							{isOpen ? (
								<ChevronDownIcon className="h-4 w-4" />
							) : (
								<ChevronRightIcon className="h-4 w-4" />
							)}
						</button>
					) : (
						<div className="w-2 h-2 rounded-none border-2 border-muted-foreground" />
					)}
				</div>
				<BuildingIcon className="h-4 w-4 flex-shrink-0 opacity-60" />
				<span className="flex-1 truncate text-sm font-medium">{node.name}</span>
				<Badge
					variant={isSelected ? "default" : "secondary"}
					className="h-5 text-xs"
				>
					{node.total_member_count || 0}人
				</Badge>
				{/* 操作按钮 */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							onClick={(e) => e.stopPropagation()}
							className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<MoreIcon className="h-4 w-4" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem onClick={() => onAddChild(node)}>
							<PlusIcon className="mr-2 h-4 w-4" />
							添加子节点
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onEdit(node)}>
							<EditIcon className="mr-2 h-4 w-4" />
							编辑
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onToggleStatus(node)}>
							<BlockIcon className="mr-2 h-4 w-4" />
							{node.status === "active" ? "禁用" : "启用"}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(node)}
							className="text-destructive"
						>
							<DeleteIcon className="mr-2 h-4 w-4" />
							删除
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Children */}
			{hasChildren && isOpen && (
				<div className="ml-4 border-l border-border pl-2">
					{node.children.map((child) => (
						<OrgTreeNode
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
				</div>
			)}
		</div>
	);
}

// Status Badge
function StatusBadge({ status }: { status: EmployeeStatus }) {
	const config: Record<EmployeeStatus, { label: string; className: string }> = {
		onboarding: { label: "入职中", className: "bg-blue-100 text-blue-800" },
		on_job: { label: "在职", className: "bg-green-100 text-green-800" },
		transferring: {
			label: "调动中",
			className: "bg-yellow-100 text-yellow-800",
		},
		offboarding: { label: "离职", className: "bg-red-100 text-red-800" },
	};
	const { label, className } = config[status];
	return <Badge className={className}>{label}</Badge>;
}

// Main Page Component
export default function OrgStructurePage() {
	// Data state
	const [orgTree, setOrgTree] = useState<OrgUnitTreeItem[]>([]);
	const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
	const [employeeTotal, setEmployeeTotal] = useState(0);

	// Loading state
	const [isLoadingTree, setIsLoadingTree] = useState(true);
	const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

	// Selection & Dashboard
	const [selectedUnit, setSelectedUnit] = useState<OrgUnitTreeItem | null>(
		null,
	);

	// Dialog states
	const [orgModalOpen, setOrgModalOpen] = useState(false);
	const [orgModalMode, setOrgModalMode] = useState<"create" | "edit">("create");
	const [editingOrgUnit, setEditingOrgUnit] = useState<OrgUnitTreeItem | null>(
		null,
	);
	const [orgFormData, setOrgFormData] = useState({ name: "", code: "" });

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

	const [deleteOrgConfirmOpen, setDeleteOrgConfirmOpen] = useState(false);
	const [deletingOrgUnit, setDeletingOrgUnit] =
		useState<OrgUnitTreeItem | null>(null);

	const [deleteEmpConfirmOpen, setDeleteEmpConfirmOpen] = useState(false);
	const [deletingEmployee, setDeletingEmployee] =
		useState<EmployeeResponse | null>(null);

	// Filter state
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	// Dashboard stats
	const dashboardData = {
		org_count: countOrgUnits(orgTree),
		total: employeeTotal,
		on_job: employees.filter((e) => e.status === "on_job").length,
		onboarding: employees.filter((e) => e.status === "onboarding").length,
	};

	// Initial load
	useEffect(() => {
		let mounted = true;

		async function loadData() {
			setIsLoadingTree(true);
			setIsLoadingEmployees(true);
			try {
				const [treeData, empData] = await Promise.all([
					getOrgUnitTree(),
					getEmployees({ page: 1, page_size: pageSize }),
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

	// Fetch employees when selection or search changes
	useEffect(() => {
		let mounted = true;

		async function loadEmployees() {
			setIsLoadingEmployees(true);
			try {
				const result = await getEmployees({
					page: currentPage,
					page_size: pageSize,
					unit_id: selectedUnit?.id,
					search: searchQuery || undefined,
				});
				if (mounted) {
					setEmployees(result.list);
					setEmployeeTotal(result.total);
				}
			} catch (err) {
				if (mounted) {
					toast.error("获取员工列表失败", {
						description:
							typeof err === "object" && err && "message" in err
								? String(err.message)
								: String(err),
					});
				}
			} finally {
				if (mounted) {
					setIsLoadingEmployees(false);
				}
			}
		}

		loadEmployees();

		return () => {
			mounted = false;
		};
	}, [currentPage, selectedUnit, searchQuery]);

	// Handlers
	const handleSelectUnit = (node: OrgUnitTreeItem) => {
		setSelectedUnit(node);
		setCurrentPage(1);
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
			// Refresh tree
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

	const handleDeleteEmployee = (emp: EmployeeResponse) => {
		setDeletingEmployee(emp);
		setDeleteEmpConfirmOpen(true);
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

	const handleAddEmployee = () => {
		// 步骤1: 直接打开用户选择对话框
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

	const handleStatusTransition = async (
		emp: EmployeeResponse,
		action: TransitionAction,
	) => {
		try {
			await updateEmployee(emp.id, { status: action.targetStatus });
			toast.success(
				`${emp.name} 已变更为「${getStatusLabel(action.targetStatus)}」`,
			);
			// Refresh employee list
			const result = await getEmployees({
				page: currentPage,
				page_size: pageSize,
				unit_id: selectedUnit?.id,
				search: searchQuery || undefined,
			});
			setEmployees(result.list);
			setEmployeeTotal(result.total);
		} catch (err) {
			toast.error("状态更新失败", {
				description:
					typeof err === "object" && err && "message" in err
						? String(err.message)
						: String(err),
			});
		}
	};

	// Create/Update org unit
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
			// Refresh tree
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

	// Delete org unit
	const handleDeleteOrgConfirm = async () => {
		if (!deletingOrgUnit) return;
		try {
			await deleteOrgUnit(deletingOrgUnit.id);
			setDeleteOrgConfirmOpen(false);
			setDeletingOrgUnit(null);
			if (selectedUnit?.id === deletingOrgUnit.id) {
				setSelectedUnit(null);
			}
			// Refresh tree
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

	// Create/Update employee
	const handleEmployeeSubmit = async () => {
		try {
			if (empModalMode === "create") {
				if (!empFormData.user_id) {
					toast.error("请先选择用户");
					return;
				}
				await createEmployee({
					employee_no: empFormData.employee_no,
					name: empFormData.name,
					// phone 由后端自动从用户信息同步，前端不需要发送
					email: empFormData.email || undefined,
					position: empFormData.position || undefined,
					primary_unit_id: empFormData.primary_unit_id,
					user_id: empFormData.user_id,
				});
			} else if (editingEmployee) {
				await updateEmployee(editingEmployee.id, {
					name: empFormData.name,
					phone: empFormData.phone || undefined,
					email: empFormData.email || undefined,
					position: empFormData.position || undefined,
					primary_unit_id: empFormData.primary_unit_id,
				});
			}
			setEmpModalOpen(false);
			// Refresh employee list
			const result = await getEmployees({
				page: currentPage,
				page_size: pageSize,
				unit_id: selectedUnit?.id,
				search: searchQuery || undefined,
			});
			setEmployees(result.list);
			setEmployeeTotal(result.total);
		} catch (err) {
			toast.error("保存员工失败", {
				description:
					typeof err === "object" && err && "message" in err
						? String(err.message)
						: String(err),
			});
		}
	};

	// Delete employee
	const handleDeleteEmployeeConfirm = async () => {
		if (!deletingEmployee) return;
		try {
			await deleteEmployee(deletingEmployee.id);
			setDeleteEmpConfirmOpen(false);
			setDeletingEmployee(null);
			// Refresh employee list
			const result = await getEmployees({
				page: currentPage,
				page_size: pageSize,
				unit_id: selectedUnit?.id,
				search: searchQuery || undefined,
			});
			setEmployees(result.list);
			setEmployeeTotal(result.total);
		} catch (err) {
			toast.error("删除员工失败", {
				description:
					typeof err === "object" && err && "message" in err
						? String(err.message)
						: String(err),
			});
		}
	};

	const totalPages = Math.ceil(employeeTotal / pageSize);

	return (
		<div className="flex flex-col gap-4 p-4 bg-muted/30">
			{/* Dashboard Stats - 顶部 */}
			<div className="grid grid-cols-4 gap-4">
				<div className="flex flex-col items-center p-4 bg-card border">
					<ApartmentIcon className="h-8 w-8 text-primary mb-2" />
					<span className="text-3xl font-bold text-primary">
						{dashboardData.org_count}
					</span>
					<span className="text-sm text-muted-foreground">组织单元</span>
				</div>
				<div className="flex flex-col items-center p-4 bg-card border">
					<GroupIcon className="h-8 w-8 text-green-600 mb-2" />
					<span className="text-3xl font-bold text-green-600">
						{dashboardData.total}
					</span>
					<span className="text-sm text-muted-foreground">员工总数</span>
				</div>
				<div className="flex flex-col items-center p-4 bg-card border">
					<CheckCircleIcon className="h-8 w-8 text-blue-600 mb-2" />
					<span className="text-3xl font-bold text-blue-600">
						{dashboardData.on_job}
					</span>
					<span className="text-sm text-muted-foreground">在职</span>
				</div>
				<div className="flex flex-col items-center p-4 bg-card border">
					<HourglassIcon className="h-8 w-8 text-yellow-600 mb-2" />
					<span className="text-3xl font-bold text-yellow-600">
						{dashboardData.onboarding}
					</span>
					<span className="text-sm text-muted-foreground">入职中</span>
				</div>
			</div>

			{/* Main Content - 左右布局 */}
			<div className="flex gap-4 flex-1">
				{/* Left Panel - Organization Tree */}
				<div className="w-96 min-w-96 bg-card border flex flex-col">
					<div className="flex items-center justify-between p-4 border-b">
						<h3 className="text-sm font-semibold">组织结构</h3>
						<Button size="sm" variant="ghost" onClick={handleAddRootNode}>
							<PlusIcon className="h-4 w-4 mr-1" />
							新增
						</Button>
					</div>
					<div className="flex-1 overflow-y-auto p-4">
						{isLoadingTree ? (
							<div className="flex items-center justify-center py-8">
								<LoaderIcon className="h-6 w-6 text-muted-foreground" />
								<span className="ml-2 text-sm text-muted-foreground">
									加载中...
								</span>
							</div>
						) : orgTree.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground text-sm">
								暂无组织数据
							</div>
						) : (
							<div className="space-y-0.5">
								{orgTree.map((node) => (
									<OrgTreeNode
										key={node.id}
										node={node}
										selectedId={selectedUnit?.id ?? null}
										onSelect={handleSelectUnit}
										onAddChild={handleAddChild}
										onEdit={handleEditOrgUnit}
										onDelete={handleDeleteOrgUnit}
										onToggleStatus={handleToggleOrgStatus}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right Panel - Employee List */}
				<div className="flex-1 bg-card border flex flex-col">
					<div className="flex items-center justify-between p-4 border-b">
						<h3 className="text-sm font-semibold">
							员工列表{selectedUnit ? ` - ${selectedUnit.name}` : ""}
						</h3>
						<div className="flex items-center gap-2">
							<Button size="sm" variant="outline">
								<UploadIcon className="h-4 w-4 mr-1" />
								导入
							</Button>
							<Button size="sm" variant="outline">
								<DownloadIcon className="h-4 w-4 mr-1" />
								导出
							</Button>
							<Button size="sm" onClick={handleAddEmployee}>
								<PlusIcon className="h-4 w-4 mr-1" />
								添加员工
							</Button>
						</div>
					</div>
					<div className="flex-1 overflow-auto p-4">
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

						{/* Table */}
						<div className="border bg-card">
							<table className="w-full text-sm" data-testid="tbl-employees">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left font-medium">工号</th>
										<th className="px-4 py-3 text-left font-medium">姓名</th>
										<th className="px-4 py-3 text-left font-medium">手机号</th>
										<th className="px-4 py-3 text-left font-medium">邮箱</th>
										<th className="px-4 py-3 text-left font-medium">职位</th>
										<th className="px-4 py-3 text-left font-medium">状态</th>
										<th className="px-4 py-3 text-right font-medium">操作</th>
									</tr>
								</thead>
								<tbody>
									{isLoadingEmployees ? (
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
													<StatusBadge status={emp.status} />
												</td>
												<td className="px-4 py-3">
													<div className="flex items-center justify-end gap-1">
														{/* Status Transition Dropdown */}
														{getAvailableActions(emp.status).length > 0 && (
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
																					handleStatusTransition(emp, action)
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
														{/* Delete Button */}
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	onClick={() => handleDeleteEmployee(emp)}
																	className="text-destructive"
																>
																	<DeleteIcon className="h-4 w-4" />
																</Button>
															</TooltipTrigger>
															<TooltipContent>删除</TooltipContent>
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
									{Math.min(currentPage * pageSize, employeeTotal)} 条，共{" "}
									{employeeTotal} 条
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
					</div>
				</div>
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
							<>
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
							</>
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
							onClick={handleEmployeeSubmit}
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
					// 选中用户后，填充数据并打开员工对话框
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

			{/* Delete Employee Confirmation */}
			<Dialog
				open={deleteEmpConfirmOpen}
				onOpenChange={setDeleteEmpConfirmOpen}
			>
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
							onClick={() => setDeleteEmpConfirmOpen(false)}
						>
							取消
						</Button>
						<Button
							variant="destructive"
							data-testid="btn-confirm-delete-emp"
							onClick={handleDeleteEmployeeConfirm}
						>
							删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Helper functions
function countOrgUnits(nodes: OrgUnitTreeItem[]): number {
	let count = 0;
	for (const node of nodes) {
		count++;
		if (node.children.length > 0) {
			count += countOrgUnits(node.children);
		}
	}
	return count;
}
