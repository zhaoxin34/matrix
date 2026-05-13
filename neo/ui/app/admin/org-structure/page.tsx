"use client";

import { useState } from "react";
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

// ==================== Types ====================
type OrgUnitType = "company" | "branch" | "department" | "sub_department";
type OrgUnitStatus = "active" | "inactive";
type EmployeeStatus = "onboarding" | "on_job" | "transferring" | "offboarding";

interface OrgUnitTreeNode {
	id: string;
	name: string;
	code: string;
	type: OrgUnitType;
	status: OrgUnitStatus;
	total_member_count: number;
	children: OrgUnitTreeNode[];
}

interface Employee {
	id: string;
	employee_no: string;
	name: string;
	phone?: string;
	email?: string;
	position?: string;
	primary_unit_id: string;
	status: EmployeeStatus;
}

// ==================== Mock Data ====================
const mockOrgTree: OrgUnitTreeNode[] = [
	{
		id: "1",
		name: "Matrix 公司",
		code: "MATRIX",
		type: "company",
		status: "active",
		total_member_count: 2,
		children: [
			{
				id: "2",
				name: "北京分公司",
				code: "MATRIX-BJ",
				type: "branch",
				status: "active",
				total_member_count: 1,
				children: [
					{
						id: "3",
						name: "技术部",
						code: "MATRIX-BJ-TECH",
						type: "department",
						status: "active",
						total_member_count: 1,
						children: [
							{
								id: "4",
								name: "技术一组",
								code: "MATRIX-BJ-TECH-G1",
								type: "sub_department",
								status: "active",
								total_member_count: 1,
								children: [],
							},
						],
					},
				],
			},
			{
				id: "5",
				name: "测试部门",
				code: "MATRIX-QA",
				type: "department",
				status: "active",
				total_member_count: 0,
				children: [],
			},
		],
	},
];

const mockEmployees: Employee[] = [
	{
		id: "1",
		employee_no: "001",
		name: "张三",
		phone: "13800138001",
		email: "zhangsan@matrix.com",
		position: "高级工程师",
		primary_unit_id: "4",
		status: "on_job",
	},
	{
		id: "2",
		employee_no: "002",
		name: "李四",
		phone: "13800138002",
		email: "lisi@matrix.com",
		position: "技术经理",
		primary_unit_id: "3",
		status: "on_job",
	},
	{
		id: "3",
		employee_no: "003",
		name: "王五",
		phone: "13800138003",
		email: "wangwu@matrix.com",
		position: "测试工程师",
		primary_unit_id: "5",
		status: "onboarding",
	},
	{
		id: "4",
		employee_no: "004",
		name: "赵六",
		phone: "13800138004",
		email: "zhaoliu@matrix.com",
		position: "前端开发",
		primary_unit_id: "4",
		status: "transferring",
	},
	{
		id: "5",
		employee_no: "005",
		name: "钱七",
		phone: "13800138005",
		email: "qianqi@matrix.com",
		position: "后端开发",
		primary_unit_id: "2",
		status: "offboarding",
	},
];

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
	node: OrgUnitTreeNode;
	selectedId: string | null;
	onSelect: (node: OrgUnitTreeNode) => void;
	onAddChild: (node: OrgUnitTreeNode) => void;
	onEdit: (node: OrgUnitTreeNode) => void;
	onDelete: (node: OrgUnitTreeNode) => void;
	onToggleStatus: (node: OrgUnitTreeNode) => void;
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
						<div className="w-2 h-2 rounded-full border-2 border-muted-foreground" />
					)}
				</div>
				<BuildingIcon className="h-4 w-4 flex-shrink-0 opacity-60" />
				<span className="flex-1 truncate text-sm font-medium">{node.name}</span>
				<Badge
					variant={isSelected ? "default" : "secondary"}
					className="h-5 text-xs"
				>
					{node.total_member_count}人
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
	const config = {
		onboarding: {
			label: "入职中",
			className: "bg-blue-100 text-blue-800",
		},
		on_job: {
			label: "在职",
			className: "bg-green-100 text-green-800",
		},
		transferring: {
			label: "调动中",
			className: "bg-yellow-100 text-yellow-800",
		},
		offboarding: {
			label: "离职",
			className: "bg-red-100 text-red-800",
		},
	};
	const { label, className } = config[status];
	return <Badge className={className}>{label}</Badge>;
}

// Main Page Component
export default function OrgStructurePage() {
	const [orgTree] = useState(mockOrgTree);
	const [employees] = useState(mockEmployees);

	// Selection & Dashboard
	const [selectedUnit, setSelectedUnit] = useState<OrgUnitTreeNode | null>(
		null,
	);
	const dashboardData = {
		org_count: countOrgUnits(orgTree),
		total: employees.length,
		on_job: employees.filter((e) => e.status === "on_job").length,
		onboarding: employees.filter((e) => e.status === "onboarding").length,
	};

	// Dialog states
	const [orgModalOpen, setOrgModalOpen] = useState(false);
	const [orgModalMode, setOrgModalMode] = useState<"create" | "edit">("create");
	const [editingOrgUnit, setEditingOrgUnit] = useState<OrgUnitTreeNode | null>(
		null,
	);
	const [orgFormData, setOrgFormData] = useState({ name: "", code: "" });

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

	const [deleteOrgConfirmOpen, setDeleteOrgConfirmOpen] = useState(false);
	const [deletingOrgUnit, setDeletingOrgUnit] =
		useState<OrgUnitTreeNode | null>(null);

	const [deleteEmpConfirmOpen, setDeleteEmpConfirmOpen] = useState(false);
	const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
		null,
	);

	// Filter state
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	// Handlers
	const handleSelectUnit = (node: OrgUnitTreeNode) => {
		setSelectedUnit(node);
		setCurrentPage(1);
	};

	const handleAddRootNode = () => {
		setOrgModalMode("create");
		setEditingOrgUnit(null);
		setOrgFormData({ name: "", code: "" });
		setOrgModalOpen(true);
	};

	const handleAddChild = (node: OrgUnitTreeNode) => {
		setOrgModalMode("create");
		setEditingOrgUnit(node);
		setOrgFormData({ name: "", code: "" });
		setOrgModalOpen(true);
	};

	const handleEditOrgUnit = (node: OrgUnitTreeNode) => {
		setOrgModalMode("edit");
		setEditingOrgUnit(node);
		setOrgFormData({ name: node.name, code: node.code });
		setOrgModalOpen(true);
	};

	const handleDeleteOrgUnit = (node: OrgUnitTreeNode) => {
		setDeletingOrgUnit(node);
		setDeleteOrgConfirmOpen(true);
	};

	const handleToggleOrgStatus = (node: OrgUnitTreeNode) => {
		console.log("Toggle status for org:", node.id);
	};

	const handleDeleteEmployee = (emp: Employee) => {
		setDeletingEmployee(emp);
		setDeleteEmpConfirmOpen(true);
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

	const handleAddEmployee = () => {
		setEmpModalMode("create");
		setEditingEmployee(null);
		setEmpFormData({
			employee_no: "",
			name: "",
			phone: "",
			email: "",
			position: "",
		});
		setEmpModalOpen(true);
	};

	// Filter employees
	const filteredEmployees = employees.filter((emp) => {
		if (selectedUnit) {
			const allIds = getAllDescendantIds(orgTree, selectedUnit.id);
			if (!allIds.includes(emp.primary_unit_id)) return false;
		}
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			return (
				emp.name.toLowerCase().includes(q) ||
				emp.employee_no.toLowerCase().includes(q) ||
				emp.phone?.includes(q) ||
				emp.email?.toLowerCase().includes(q)
			);
		}
		return true;
	});

	const totalPages = Math.ceil(filteredEmployees.length / pageSize);
	const paginatedEmployees = filteredEmployees.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize,
	);


	return (
		<div className="flex flex-col gap-4 p-4 min-h-svh bg-muted/30">
			{/* Dashboard Stats - 顶部 */}
			<div className="grid grid-cols-4 gap-4">
				<div className="flex flex-col items-center p-4 rounded-lg bg-card border">
					<ApartmentIcon className="h-8 w-8 text-primary mb-2" />
					<span className="text-3xl font-bold text-primary">{dashboardData.org_count}</span>
					<span className="text-sm text-muted-foreground">组织单元</span>
				</div>
				<div className="flex flex-col items-center p-4 rounded-lg bg-card border">
					<GroupIcon className="h-8 w-8 text-green-600 mb-2" />
					<span className="text-3xl font-bold text-green-600">{dashboardData.total}</span>
					<span className="text-sm text-muted-foreground">员工总数</span>
				</div>
				<div className="flex flex-col items-center p-4 rounded-lg bg-card border">
					<CheckCircleIcon className="h-8 w-8 text-blue-600 mb-2" />
					<span className="text-3xl font-bold text-blue-600">{dashboardData.on_job}</span>
					<span className="text-sm text-muted-foreground">在职</span>
				</div>
				<div className="flex flex-col items-center p-4 rounded-lg bg-card border">
					<HourglassIcon className="h-8 w-8 text-yellow-600 mb-2" />
					<span className="text-3xl font-bold text-yellow-600">{dashboardData.onboarding}</span>
					<span className="text-sm text-muted-foreground">入职中</span>
				</div>
			</div>

			{/* Main Content - 左右布局 */}
			<div className="flex gap-4 flex-1">
				{/* Left Panel - Organization Tree */}
				<div className="w-72 min-w-72 rounded-lg bg-card border flex flex-col">
					<div className="flex items-center justify-between p-4 border-b">
						<h3 className="text-sm font-semibold">组织结构</h3>
						<Button size="sm" variant="ghost" onClick={handleAddRootNode}>
							<PlusIcon className="h-4 w-4 mr-1" />
							新增
						</Button>
					</div>
					<div className="flex-1 overflow-y-auto p-4">
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
					</div>
				</div>

				{/* Right Panel - Employee List */}
				<div className="flex-1 rounded-lg bg-card border flex flex-col">
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
						<div className="rounded-md border bg-card">
							<table className="w-full text-sm">
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
									{paginatedEmployees.map((emp, index) => (
										<tr
											key={emp.id}
											className={cn(
												"border-b last:border-b-0 hover:bg-muted/30",
												index % 2 === 1 && "bg-muted/30"
											)}
										>
											<td className="px-4 py-3 font-mono">{emp.employee_no}</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
														<UserIcon className="h-4 w-4 text-primary" />
													</div>
													<span className="font-medium">{emp.name}</span>
												</div>
											</td>
											<td className="px-4 py-3">{emp.phone || "-"}</td>
											<td className="px-4 py-3 text-muted-foreground">{emp.email || "-"}</td>
											<td className="px-4 py-3">{emp.position || "-"}</td>
											<td className="px-4 py-3">
												<StatusBadge status={emp.status} />
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-1">
													<Tooltip>
														<TooltipTrigger asChild>
															<Button variant="ghost" size="icon-sm" onClick={() => handleEditEmployee(emp)}>
																<EditIcon className="h-4 w-4" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>编辑</TooltipContent>
													</Tooltip>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button variant="ghost" size="icon-sm" onClick={() => handleDeleteEmployee(emp)} className="text-destructive">
																<DeleteIcon className="h-4 w-4" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>删除</TooltipContent>
													</Tooltip>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>

							{/* Pagination */}
							<div className="flex items-center justify-between border-t p-4">
								<div className="text-sm text-muted-foreground">
									显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredEmployees.length)} 条，共 {filteredEmployees.length} 条
								</div>
								<div className="flex items-center gap-2">
									<Button variant="outline" size="icon-sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
										<ChevronLeftIcon className="h-4 w-4" />
									</Button>
									<span className="text-sm">第 {currentPage} / {totalPages || 1} 页</span>
									<Button variant="outline" size="icon-sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
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
						<Button
							onClick={() => {
								console.log(
									orgModalMode === "create" ? "Create org:" : "Edit org:",
									editingOrgUnit?.id,
									orgFormData,
								);
								setOrgModalOpen(false);
							}}
						>
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
						<div className="space-y-2">
							<Label htmlFor="emp-no">工号</Label>
							<Input
								id="emp-no"
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
							<Label htmlFor="emp-name">姓名</Label>
							<Input
								id="emp-name"
								value={empFormData.name}
								onChange={(e) =>
									setEmpFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder="请输入姓名"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="emp-phone">手机号</Label>
							<Input
								id="emp-phone"
								value={empFormData.phone}
								onChange={(e) =>
									setEmpFormData((prev) => ({ ...prev, phone: e.target.value }))
								}
								placeholder="请输入手机号"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="emp-email">邮箱</Label>
							<Input
								id="emp-email"
								type="email"
								value={empFormData.email}
								onChange={(e) =>
									setEmpFormData((prev) => ({ ...prev, email: e.target.value }))
								}
								placeholder="请输入邮箱"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="emp-position">职位</Label>
							<Input
								id="emp-position"
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
							onClick={() => {
								console.log(
									empModalMode === "create"
										? "Create employee:"
										: "Edit employee:",
									editingEmployee?.id,
									empFormData,
								);
								setEmpModalOpen(false);
							}}
						>
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
							onClick={() => {
								console.log("Delete org:", deletingOrgUnit?.id);
								setDeleteOrgConfirmOpen(false);
								setDeletingOrgUnit(null);
							}}
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
							onClick={() => {
								console.log("Delete employee:", deletingEmployee?.id);
								setDeleteEmpConfirmOpen(false);
								setDeletingEmployee(null);
							}}
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
function countOrgUnits(nodes: OrgUnitTreeNode[]): number {
	let count = 0;
	for (const node of nodes) {
		count++;
		if (node.children.length > 0) {
			count += countOrgUnits(node.children);
		}
	}
	return count;
}

function getAllDescendantIds(
	nodes: OrgUnitTreeNode[],
	parentId: string,
): string[] {
	const result: string[] = [];
	const findNode = (nodes: OrgUnitTreeNode[]): OrgUnitTreeNode | null => {
		for (const node of nodes) {
			if (node.id === parentId) return node;
			const found = findNode(node.children);
			if (found) return found;
		}
		return null;
	};
	const node = findNode(nodes);
	if (node) {
		result.push(node.id);
		const collectIds = (n: OrgUnitTreeNode) => {
			for (const child of n.children) {
				result.push(child.id);
				collectIds(child);
			}
		};
		collectIds(node);
	}
	return result;
}
