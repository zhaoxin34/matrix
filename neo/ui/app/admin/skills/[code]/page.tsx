"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
	ArrowLeft,
	Plus,
	FileText,
	Folder,
	FolderOpen,
	Trash2,
	ChevronDown,
	History,
	Upload,
	Save,
	RotateCcw,
	File,
} from "lucide-react";

// ==================== Types ====================
type SkillLevel = "Planning" | "Functional" | "Atomic";
type SkillStatus = "draft" | "active" | "disabled";

interface FileNode {
	id: number;
	name: string;
	path: string;
	isDir: boolean;
	children?: FileNode[];
}

interface SkillVersion {
	id: number;
	version: string;
	comment: string;
	created_at: string;
	file_count: number;
}

// ==================== Mock Data ====================
const mockSkillData = {
	id: 1,
	code: "user-auth",
	name: "用户认证",
	level: "Planning" as SkillLevel,
	status: "active" as SkillStatus,
	tags: ["认证", "安全"],
	create_user: "张三",
	created_at: "2026-05-10 10:00:00",
	updated_at: "2026-05-15 14:30:00",
};

const mockFileTree: FileNode[] = [
	{
		id: 1,
		name: "SKILL.md",
		path: "SKILL.md",
		isDir: false,
	},
	{
		id: 2,
		name: "scripts",
		path: "scripts",
		isDir: true,
		children: [
			{ id: 3, name: "auth.py", path: "scripts/auth.py", isDir: false },
			{ id: 4, name: "token.py", path: "scripts/token.py", isDir: false },
		],
	},
	{
		id: 5,
		name: "docs",
		path: "docs",
		isDir: true,
		children: [
			{
				id: 6,
				name: "guides",
				path: "docs/guides",
				isDir: true,
				children: [
					{
						id: 7,
						name: "quickstart.md",
						path: "docs/guides/quickstart.md",
						isDir: false,
					},
				],
			},
			{ id: 8, name: "api.md", path: "docs/api.md", isDir: false },
		],
	},
];

const mockFileContents: Record<string, string> = {
	"SKILL.md": `# 用户认证 Skill

## 概述
这是一个用于用户认证的 Skill。

## 功能
- 用户登录
- 用户注册
- 密码重置

## 使用方法
\`\`\`python
from auth import login
login(username, password)
\`\`\`
`,
	"scripts/auth.py": `# Authentication module

def login(username, password):
    """User login function"""
    # TODO: Implement login
    pass

def logout():
    """User logout function"""
    pass
`,
	"scripts/token.py": `# Token management

import time

def generate_token(user_id):
    """Generate JWT token"""
    return f"token_{user_id}_{int(time.time())}"
`,
	"docs/api.md": `# API Documentation

## Endpoints

### POST /api/login
User login endpoint.

### POST /api/logout
User logout endpoint.
`,
	"docs/guides/quickstart.md": `# Quick Start Guide

1. Install the auth module
2. Configure your credentials
3. Start using the API
`,
};

const mockVersions: SkillVersion[] = [
	{
		id: 1,
		version: "1.0.0",
		comment: "初始版本",
		created_at: "2026-05-10 10:00:00",
		file_count: 3,
	},
	{
		id: 2,
		version: "1.1.0",
		comment: "新增 token 管理功能",
		created_at: "2026-05-12 14:00:00",
		file_count: 4,
	},
	{
		id: 3,
		version: "1.2.0",
		comment: "添加 API 文档",
		created_at: "2026-05-15 14:30:00",
		file_count: 5,
	},
];

// ==================== Components ====================

// File Tree Node
function FileTreeNode({
	node,
	selectedPath,
	onSelect,
	onDelete,
	depth = 0,
}: {
	node: FileNode;
	selectedPath: string | null;
	onSelect: (node: FileNode) => void;
	onDelete: (node: FileNode) => void;
	depth?: number;
}) {
	const [isOpen, setIsOpen] = useState(depth === 0); // Root level open by default
	const isSelected = selectedPath === node.path;
	const hasChildren = node.isDir && node.children && node.children.length > 0;

	return (
		<div>
			<div
				className={cn(
					"group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer hover:bg-accent transition-colors",
					isSelected && "bg-primary text-primary-foreground",
				)}
				onClick={() => {
					if (node.isDir) {
						setIsOpen(!isOpen);
					} else {
						onSelect(node);
					}
				}}
			>
				{/* Expand/Collapse Icon */}
				<div className="w-4 flex-shrink-0">
					{hasChildren && (
						<ChevronDown
							className={cn(
								"h-3.5 w-3.5 text-muted-foreground transition-transform",
								!isOpen && "-rotate-90",
							)}
						/>
					)}
				</div>

				{/* File/Folder Icon */}
				{node.isDir ? (
					isOpen ? (
						<FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
					) : (
						<Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
					)
				) : (
					<FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
				)}

				{/* Name */}
				<span className="flex-1 truncate text-sm">{node.name}</span>

				{/* Delete Button */}
				{!node.isDir && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete(node);
						}}
						className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/20 rounded transition-opacity"
					>
						<Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
					</button>
				)}
			</div>

			{/* Children */}
			{hasChildren && isOpen && (
				<div className="ml-4">
					{node.children!.map((child) => (
						<FileTreeNode
							key={child.id}
							node={child}
							selectedPath={selectedPath}
							onSelect={onSelect}
							onDelete={onDelete}
							depth={depth + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}

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
export default function SkillEditorPage() {
	const router = useRouter();

	const [skill] = useState(mockSkillData);
	const [fileTree] = useState(mockFileTree);
	const [fileContents] = useState(mockFileContents);

	// Selected file
	const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
	const [currentContent, setCurrentContent] = useState("");

	// Dialog states
	const [versionDialogOpen, setVersionDialogOpen] = useState(false);
	const [publishDialogOpen, setPublishDialogOpen] = useState(false);
	const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false);
	const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
	const [deletingFile, setDeletingFile] = useState<FileNode | null>(null);

	// Form states
	const [publishForm, setPublishForm] = useState({ version: "", comment: "" });
	const [newFileForm, setNewFileForm] = useState({ name: "", path: "" });

	// Handle file selection
	const handleSelectFile = (node: FileNode) => {
		if (node.isDir) return;

		// Save current content before switching
		if (selectedFile && currentContent !== fileContents[selectedFile.path]) {
			console.log("Saving changes for:", selectedFile.path);
		}

		setSelectedFile(node);
		setCurrentContent(fileContents[node.path] || "");
	};

	// Handle file delete
	const handleDeleteFile = (node: FileNode) => {
		setDeletingFile(node);
		setDeleteFileDialogOpen(true);
	};

	const confirmDeleteFile = () => {
		console.log("Delete file:", deletingFile?.path);
		setDeleteFileDialogOpen(false);
		setDeletingFile(null);
		if (selectedFile?.id === deletingFile?.id) {
			setSelectedFile(null);
			setCurrentContent("");
		}
	};

	// Handle create file
	const handleCreateFile = () => {
		console.log("Create file:", newFileForm);
		setNewFileDialogOpen(false);
		setNewFileForm({ name: "", path: "" });
	};

	// Handle publish
	const handlePublish = () => {
		console.log("Publish:", publishForm);
		setPublishDialogOpen(false);
		setPublishForm({ version: "", comment: "" });
	};

	// Handle rollback
	const handleRollback = (version: SkillVersion) => {
		console.log("Rollback to:", version.version);
		setVersionDialogOpen(false);
	};

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b bg-card">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/admin/skills")}
					>
						<ArrowLeft className="mr-1 h-4 w-4" />
						返回
					</Button>
					<div className="flex items-center gap-2">
						<h1 className="text-lg font-semibold">{skill.name}</h1>
						<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
							{skill.code}
						</code>
					</div>
					<LevelBadge level={skill.level} />
					<StatusBadge status={skill.status} />
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setVersionDialogOpen(true)}
					>
						<History className="mr-1 h-4 w-4" />
						历史版本
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => console.log("Manual save")}
					>
						<Save className="mr-1 h-4 w-4" />
						保存
					</Button>
					<Button size="sm" onClick={() => setPublishDialogOpen(true)}>
						<Upload className="mr-1 h-4 w-4" />
						发布
					</Button>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Panel - File Tree */}
				<div className="w-64 border-r bg-card flex flex-col">
					<div className="flex items-center justify-between px-3 py-2 border-b">
						<span className="text-sm font-medium">文件</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setNewFileDialogOpen(true)}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>新建文件</TooltipContent>
						</Tooltip>
					</div>

					<ScrollArea className="flex-1 p-2">
						<div className="space-y-0.5">
							{fileTree.map((node) => (
								<FileTreeNode
									key={node.id}
									node={node}
									selectedPath={selectedFile?.path ?? null}
									onSelect={handleSelectFile}
									onDelete={handleDeleteFile}
								/>
							))}
						</div>
					</ScrollArea>
				</div>

				{/* Right Panel - Editor */}
				<div className="flex-1 flex flex-col">
					{selectedFile ? (
						<>
							{/* File Header */}
							<div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
								<div className="flex items-center gap-2">
									<FileText className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">
										{selectedFile.name}
									</span>
									<span className="text-xs text-muted-foreground font-mono">
										{selectedFile.path}
									</span>
								</div>
								<Badge variant="outline" className="text-xs">
									草稿
								</Badge>
							</div>

							{/* Editor Content */}
							<div className="flex-1 relative">
								{/* Mock Monaco Editor */}
								<div className="absolute inset-0 p-4">
									<textarea
										value={currentContent}
										onChange={(e) => setCurrentContent(e.target.value)}
										className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="选择文件进行编辑..."
										spellCheck={false}
									/>
								</div>
							</div>
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
							<File className="h-16 w-16 mb-4 opacity-30" />
							<p className="text-sm">从左侧选择文件进行编辑</p>
						</div>
					)}
				</div>
			</div>

			{/* Version History Dialog */}
			<Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>版本历史</DialogTitle>
						<DialogDescription>
							查看历史版本，支持回滚到指定版本
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-4 max-h-96 overflow-y-auto">
						{mockVersions.map((version, index) => (
							<div
								key={version.id}
								className={cn(
									"flex items-start gap-4 p-3 rounded-lg border",
									index === 0 && "border-primary bg-primary/5",
								)}
							>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-mono font-medium text-sm">
											v{version.version}
										</span>
										{index === 0 && <Badge className="text-xs">当前版本</Badge>}
									</div>
									<p className="text-sm text-muted-foreground mb-1">
										{version.comment}
									</p>
									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										<span>{version.created_at}</span>
										<span>{version.file_count} 个文件</span>
									</div>
								</div>
								{index > 0 && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleRollback(version)}
											>
												<RotateCcw className="mr-1 h-4 w-4" />
												回滚
											</Button>
										</TooltipTrigger>
										<TooltipContent>回滚到 v{version.version}</TooltipContent>
									</Tooltip>
								)}
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>

			{/* Publish Dialog */}
			<Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>发布新版本</DialogTitle>
						<DialogDescription>
							创建新版本，当前草稿将作为新版本内容
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="version">版本号</Label>
							<Input
								id="version"
								value={publishForm.version}
								onChange={(e) =>
									setPublishForm((prev) => ({
										...prev,
										version: e.target.value,
									}))
								}
								placeholder="如：1.3.0"
							/>
							<p className="text-xs text-muted-foreground">
								建议遵循语义化版本，如：1.0.0, 1.1.0, 2.0.0
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="comment">发布说明</Label>
							<Textarea
								id="comment"
								value={publishForm.comment}
								onChange={(e) =>
									setPublishForm((prev) => ({
										...prev,
										comment: e.target.value,
									}))
								}
								placeholder="描述本次更新的内容..."
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setPublishDialogOpen(false)}
						>
							取消
						</Button>
						<Button
							onClick={handlePublish}
							disabled={!publishForm.version || !publishForm.comment}
						>
							发布
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete File Confirmation */}
			<Dialog
				open={deleteFileDialogOpen}
				onOpenChange={setDeleteFileDialogOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>确认删除</DialogTitle>
						<DialogDescription>
							确定删除文件「{deletingFile?.name}」吗？此操作不可恢复。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteFileDialogOpen(false)}
						>
							取消
						</Button>
						<Button variant="destructive" onClick={confirmDeleteFile}>
							删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* New File Dialog */}
			<Dialog open={newFileDialogOpen} onOpenChange={setNewFileDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>新建文件</DialogTitle>
						<DialogDescription>在当前 Skill 中创建新文件</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="file-name">文件名</Label>
							<Input
								id="file-name"
								value={newFileForm.name}
								onChange={(e) =>
									setNewFileForm((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder="如：utils.py"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="file-path">路径</Label>
							<Input
								id="file-path"
								value={newFileForm.path}
								onChange={(e) =>
									setNewFileForm((prev) => ({ ...prev, path: e.target.value }))
								}
								placeholder="如：scripts/utils.py"
							/>
							<p className="text-xs text-muted-foreground">
								路径用于组织文件结构，如：scripts/utils.py
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setNewFileDialogOpen(false)}
						>
							取消
						</Button>
						<Button onClick={handleCreateFile} disabled={!newFileForm.name}>
							创建
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
