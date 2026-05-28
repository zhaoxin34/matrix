"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
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
  Loader2,
} from "lucide-react";
import {
  getSkill,
  getFileTree,
  getFileContent,
  createFile,
  updateFile,
  deleteFile,
  getVersions,
  publishSkill,
  rollbackSkill,
  type Skill,
  type FileNode,
  type SkillVersion,
  type SkillLevel,
  type SkillStatus,
} from "@/lib/api/skills";

// 动态导入 Monaco Editor (禁用 SSR)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      加载编辑器中...
    </div>
  ),
});

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

// Helper function to detect language from filename
function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    sh: "shell",
    bash: "shell",
    md: "markdown",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    html: "html",
    css: "css",
    sql: "sql",
  };
  return languageMap[ext] || "plaintext";
}

// Main Page
export default function SkillEditorPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  // Data states
  const [skill, setSkill] = useState<Skill | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [versions, setVersions] = useState<SkillVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected file
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [currentContent, setCurrentContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);

  // Dialog states
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false);
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [deletingFile, setDeletingFile] = useState<FileNode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [publishForm, setPublishForm] = useState({ version: "", comment: "" });
  const [newFileForm, setNewFileForm] = useState({
    name: "",
    path: "",
    content: "",
  });

  // Load skill data
  const loadSkillData = useCallback(async () => {
    setLoading(true);
    try {
      const [skillData, treeData, versionsData] = await Promise.all([
        getSkill(code),
        getFileTree(code),
        getVersions(code),
      ]);
      setSkill(skillData);
      setFileTree(treeData);
      setVersions(versionsData);
    } catch (error) {
      console.error("Failed to load skill:", error);
      alert("加载失败");
      router.push("/admin/skills");
    } finally {
      setLoading(false);
    }
  }, [code, router]);

  // Load skill data on mount
  useEffect(() => {
    const doLoad = async () => {
      await loadSkillData();
    };
    doLoad();
  }, [loadSkillData]);

  // Handle file selection
  const handleSelectFile = async (node: FileNode) => {
    if (node.isDir) return;

    // Save current content before switching
    if (selectedFile && currentContent !== originalContent) {
      try {
        await updateFile(code, selectedFile.path, { content: currentContent });
      } catch (error) {
        console.error("Failed to save:", error);
      }
    }

    setSelectedFile(node);
    setFileLoading(true);
    try {
      const fileData = await getFileContent(code, node.path);
      setCurrentContent(fileData.content);
      setOriginalContent(fileData.content);
    } catch (error) {
      console.error("Failed to load file:", error);
      setCurrentContent("");
      setOriginalContent("");
    } finally {
      setFileLoading(false);
    }
  };

  // Handle file delete
  const handleDeleteFile = (node: FileNode) => {
    setDeletingFile(node);
    setDeleteFileDialogOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!deletingFile) return;
    setSubmitting(true);
    try {
      await deleteFile(code, deletingFile.path);
      setDeleteFileDialogOpen(false);
      setDeletingFile(null);
      if (selectedFile?.path === deletingFile.path) {
        setSelectedFile(null);
        setCurrentContent("");
        setOriginalContent("");
      }
      // Refresh file tree
      const tree = await getFileTree(code);
      setFileTree(tree);
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("删除失败");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle create file
  const handleCreateFile = async () => {
    if (!newFileForm.name) return;
    setSubmitting(true);
    try {
      await createFile(code, {
        name: newFileForm.name,
        path: newFileForm.path || newFileForm.name,
        content: newFileForm.content || "",
      });
      setNewFileDialogOpen(false);
      setNewFileForm({ name: "", path: "", content: "" });
      // Refresh file tree
      const tree = await getFileTree(code);
      setFileTree(tree);
    } catch (error) {
      console.error("Failed to create file:", error);
      alert("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle manual save
  const handleSave = async () => {
    if (!selectedFile) return;
    setSubmitting(true);
    try {
      await updateFile(code, selectedFile.path, { content: currentContent });
      setOriginalContent(currentContent);
      alert("保存成功");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle publish
  const handlePublish = async () => {
    if (!publishForm.version || !publishForm.comment) return;
    setSubmitting(true);
    try {
      await publishSkill(code, {
        version: publishForm.version,
        comment: publishForm.comment,
      });
      setPublishDialogOpen(false);
      setPublishForm({ version: "", comment: "" });
      // Refresh skill data
      await loadSkillData();
      alert("发布成功");
    } catch (error) {
      console.error("Failed to publish:", error);
      alert("发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle rollback
  const handleRollback = async (version: SkillVersion) => {
    if (!confirm(`确定回滚到版本 ${version.version} 吗？`)) return;
    setSubmitting(true);
    try {
      await rollbackSkill(code, { version_id: version.id });
      setVersionDialogOpen(false);
      // Refresh skill data
      await loadSkillData();
      alert("回滚成功");
    } catch (error) {
      console.error("Failed to rollback:", error);
      alert("回滚失败");
    } finally {
      setSubmitting(false);
    }
  };

  const isDirty = currentContent !== originalContent;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Skill 不存在</p>
      </div>
    );
  }

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
            历史版本 ({versions.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!selectedFile || !isDirty || submitting}
          >
            {submitting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
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
            fileLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                  {isDirty && (
                    <Badge
                      variant="outline"
                      className="text-xs text-orange-500"
                    >
                      未保存
                    </Badge>
                  )}
                </div>

                {/* Monaco Editor */}
                <div className="flex-1">
                  <MonacoEditor
                    height="100%"
                    language={getLanguage(selectedFile.name)}
                    value={currentContent}
                    onChange={(value) => setCurrentContent(value || "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: "on",
                      padding: { top: 16 },
                    }}
                  />
                </div>
              </>
            )
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
            {versions.map((version, index) => (
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
                        disabled={submitting}
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
            {versions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                暂无版本历史
              </p>
            )}
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
              disabled={
                !publishForm.version || !publishForm.comment || submitting
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发布中...
                </>
              ) : (
                "发布"
              )}
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
            <Button
              variant="destructive"
              onClick={confirmDeleteFile}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                "删除"
              )}
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
                路径用于组织文件结构，如留空则使用文件名
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-content">初始内容（可选）</Label>
              <Textarea
                id="file-content"
                value={newFileForm.content}
                onChange={(e) =>
                  setNewFileForm((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="文件初始内容..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewFileDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateFile}
              disabled={!newFileForm.name || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                "创建"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
