"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
	Plus,
	Search,
	Edit3,
	Trash2,
	Ban,
	MoreHorizontal,
	FileText,
} from "lucide-react";
import {
	mockSkills,
	type SkillLevel,
	type SkillStatus,
	type Skill,
} from "@/mockdata/admin/skills";

// ==================== Components ====================

// Level Badge
function LevelBadge({ level }: { level: SkillLevel }) {
	const config = {
		Planning: { label: "规划级", className: "bg-purple-100 text-purple-800" },
		Functional: { label: "功能级", className: "bg-blue-100 text-blue-800" },
		Atomic: { label: "原子级", className: "bg-green-100 text-green-800" },
	};
	const { label, className } = config[level];
	return <Badge className={cn("text-xs", className)}>{label}</Badge>;
}

// Status Badge
function StatusBadge({ status }: { status: SkillStatus }) {
	const config = {
		draft: {
			label: "草稿",
			className: "bg-gray-100 text-gray-700 border-gray-300",
		},
		active: {
			label: "激活",
			className: "bg-green-100 text-green-800 border-green-300",
		},
		disabled: {
			label: "禁用",
			className: "bg-red-100 text-red-700 border-red-300",
		},
	};
	const { label, className } = config[status];
	return (
		<Badge variant="outline" className={cn("text-xs", className)}>
			{label}
		</Badge>
	);
}

// Main Page
export default function SkillsListPage() {
	const router = useRouter();
	const [skills] = useState<Skill[]>(mockSkills);

	// Filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [levelFilter, setLevelFilter] = useState<string>("all");

	// Dialog states
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [disableDialogOpen, setDisableDialogOpen] = useState(false);
	const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
	const [disablingSkill, setDisablingSkill] = useState<Skill | null>(null);
	const [createFormData, setCreateFormData] = useState({
		name: "",
		code: "",
		level: "Functional" as SkillLevel,
		tags: "",
	});

	// Filter skills
	const filteredSkills = skills.filter((skill) => {
		// Search
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			if (
				!skill.name.toLowerCase().includes(q) &&
				!skill.code.toLowerCase().includes(q)
			) {
				return false;
			}
		}
		// Status filter
		if (statusFilter !== "all" && skill.status !== statusFilter) {
			return false;
		}
		// Level filter
		if (levelFilter !== "all" && skill.level !== levelFilter) {
			return false;
		}
		return true;
	});

	const handleCreate = () => {
		console.log("Create skill:", createFormData);
		setCreateDialogOpen(false);
		setCreateFormData({ name: "", code: "", level: "Functional", tags: "" });
	};

	const handleDelete = (skill: Skill) => {
		setDeletingSkill(skill);
		setDeleteDialogOpen(true);
	};

	const handleDisable = (skill: Skill) => {
		setDisablingSkill(skill);
		setDisableDialogOpen(true);
	};

	const confirmDelete = () => {
		console.log("Delete skill:", deletingSkill?.code);
		setDeleteDialogOpen(false);
		setDeletingSkill(null);
	};

	const confirmDisable = () => {
		console.log("Disable skill:", disablingSkill?.code);
		setDisableDialogOpen(false);
		setDisablingSkill(null);
	};

	return (
		<div className="flex flex-col h-full bg-muted/30">
			{/* Page Header */}
			<div className="flex items-center justify-between px-6 py-4 bg-card border-b">
				<div className="flex items-center gap-4">
					<h1 className="text-lg font-semibold">Skills 管理</h1>
					<Badge variant="secondary" className="text-xs">
						共 {filteredSkills.length} 个
					</Badge>
				</div>
				<Button onClick={() => setCreateDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					新建 Skill
				</Button>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4 px-6 py-3 bg-card border-b">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="搜索名称或编码..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-32">
						<SelectValue placeholder="状态" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">全部状态</SelectItem>
						<SelectItem value="draft">草稿</SelectItem>
						<SelectItem value="active">激活</SelectItem>
						<SelectItem value="disabled">禁用</SelectItem>
					</SelectContent>
				</Select>

				<Select value={levelFilter} onValueChange={setLevelFilter}>
					<SelectTrigger className="w-32">
						<SelectValue placeholder="粒度级别" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">全部级别</SelectItem>
						<SelectItem value="Planning">规划级</SelectItem>
						<SelectItem value="Functional">功能级</SelectItem>
						<SelectItem value="Atomic">原子级</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			<div className="flex-1 overflow-auto p-6">
				<div className="border bg-card">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left font-medium w-48">名称</th>
								<th className="px-4 py-3 text-left font-medium w-40">编码</th>
								<th className="px-4 py-3 text-left font-medium w-24">级别</th>
								<th className="px-4 py-3 text-left font-medium">标签</th>
								<th className="px-4 py-3 text-center font-medium w-20">文件</th>
								<th className="px-4 py-3 text-center font-medium w-20">版本</th>
								<th className="px-4 py-3 text-center font-medium w-20">状态</th>
								<th className="px-4 py-3 text-left font-medium w-32">
									更新时间
								</th>
								<th className="px-4 py-3 text-center font-medium w-24">操作</th>
							</tr>
						</thead>
						<tbody>
							{filteredSkills.map((skill, index) => (
								<tr
									key={skill.id}
									className={cn(
										"border-b last:border-b-0 hover:bg-muted/30 transition-colors",
										index % 2 === 1 && "bg-muted/30",
									)}
								>
									<td className="px-4 py-3">
										<Link
											href={`/admin/skills/${skill.code}`}
											className="font-medium text-primary hover:underline"
										>
											{skill.name}
										</Link>
									</td>
									<td className="px-4 py-3">
										<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
											{skill.code}
										</code>
									</td>
									<td className="px-4 py-3">
										<LevelBadge level={skill.level} />
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-wrap gap-1">
											{skill.tags.map((tag) => (
												<Badge
													key={tag}
													variant="outline"
													className="text-xs h-5"
												>
													{tag}
												</Badge>
											))}
										</div>
									</td>
									<td className="px-4 py-3 text-center text-muted-foreground">
										{skill.file_count}
									</td>
									<td className="px-4 py-3 text-center text-muted-foreground">
										{skill.version_count}
									</td>
									<td className="px-4 py-3 text-center">
										<StatusBadge status={skill.status} />
									</td>
									<td className="px-4 py-3 text-muted-foreground text-xs">
										{skill.updated_at}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-center gap-1">
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() =>
															router.push(`/admin/skills/${skill.code}`)
														}
													>
														<Edit3 className="h-4 w-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>编辑</TooltipContent>
											</Tooltip>

											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon-sm">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													{skill.status === "active" && (
														<DropdownMenuItem
															onClick={() => handleDisable(skill)}
														>
															<Ban className="mr-2 h-4 w-4" />
															禁用
														</DropdownMenuItem>
													)}
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => handleDelete(skill)}
														className="text-destructive"
													>
														<Trash2 className="mr-2 h-4 w-4" />
														删除
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{filteredSkills.length === 0 && (
						<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
							<FileText className="h-12 w-12 mb-4 opacity-50" />
							<p>暂无数据</p>
						</div>
					)}
				</div>
			</div>

			{/* Create Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>新建 Skill</DialogTitle>
						<DialogDescription>
							创建一个新的 Skill，可以包含多个文件。
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">名称</Label>
							<Input
								id="name"
								value={createFormData.name}
								onChange={(e) =>
									setCreateFormData((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								placeholder="如：用户认证"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="code">编码</Label>
							<Input
								id="code"
								value={createFormData.code}
								onChange={(e) =>
									setCreateFormData((prev) => ({
										...prev,
										code: e.target.value,
									}))
								}
								placeholder="如：user-auth"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="level">粒度级别</Label>
							<Select
								value={createFormData.level}
								onValueChange={(v) =>
									setCreateFormData((prev) => ({
										...prev,
										level: v as SkillLevel,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Planning">
										规划级 - 复杂业务流程
									</SelectItem>
									<SelectItem value="Functional">
										功能级 - 常见业务场景
									</SelectItem>
									<SelectItem value="Atomic">
										原子级 - 最小可复用单元
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="tags">标签</Label>
							<Input
								id="tags"
								value={createFormData.tags}
								onChange={(e) =>
									setCreateFormData((prev) => ({
										...prev,
										tags: e.target.value,
									}))
								}
								placeholder="多个标签用逗号分隔，如：认证,安全"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCreateDialogOpen(false)}
						>
							取消
						</Button>
						<Button onClick={handleCreate}>创建</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>确认删除</DialogTitle>
						<DialogDescription>
							确定删除 Skill「{deletingSkill?.name}」吗？此操作不可恢复。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
						>
							取消
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Disable Confirmation Dialog */}
			<Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>确认禁用</DialogTitle>
						<DialogDescription>
							确定禁用 Skill「{disablingSkill?.name}」吗？禁用后将无法使用。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDisableDialogOpen(false)}
						>
							取消
						</Button>
						<Button onClick={confirmDisable}>禁用</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
