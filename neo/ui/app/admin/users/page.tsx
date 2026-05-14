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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icon Components
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

function PhoneIcon({ className }: { className?: string }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

function TrashIcon({ className }: { className?: string }) {
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
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
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

function ShieldCheckIcon({ className }: { className?: string }) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// Mock Data
const mockUsers = [
  {
    id: "1",
    username: "张三",
    phone: "13800138001",
    email: "zhang@qq.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-01-15 10:30",
  },
  {
    id: "2",
    username: "李四",
    phone: "13800138002",
    email: "li@qq.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-02-20 14:22",
  },
  {
    id: "3",
    username: "王五",
    phone: "13800138003",
    email: "wang@163.com",
    isSuperAdmin: false,
    isActive: false,
    createdAt: "2026-03-05 09:15",
  },
  {
    id: "4",
    username: "赵六",
    phone: "13800138004",
    email: "zhao@gmail.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-03-10 16:45",
  },
  {
    id: "5",
    username: "系统管理员",
    phone: "13800138000",
    email: "admin@neo.com",
    isSuperAdmin: true,
    isActive: true,
    createdAt: "2025-12-01 00:00",
  },
  {
    id: "6",
    username: "孙七",
    phone: "13800138005",
    email: "sun@126.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-04-02 11:20",
  },
  {
    id: "7",
    username: "周八",
    phone: "13800138006",
    email: "zhou@yahoo.com",
    isSuperAdmin: false,
    isActive: true,
    createdAt: "2026-04-15 08:30",
  },
  {
    id: "8",
    username: "吴九",
    phone: "13800138007",
    email: "wu@outlook.com",
    isSuperAdmin: false,
    isActive: false,
    createdAt: "2026-04-20 13:55",
  },
];

interface UserFormData {
  username: string;
  phone: string;
  email: string;
}

// User Form Component
// User Form Component
function UserForm({
  user,
  onSubmit,
  onCancel,
}: {
  user?: (typeof mockUsers)[0];
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
}) {
  const isEditMode = !!user;
  const [formData, setFormData] = useState<UserFormData>({
    username: user?.username || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-username" className="text-sm font-medium">
          用户名
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="form-username"
            value={formData.username}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, username: e.target.value }))
            }
            placeholder="请输入用户名"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-phone" className="text-sm font-medium">
          手机号
          {isEditMode && (
            <span className="text-muted-foreground font-normal ml-1">
              （不可修改）
            </span>
          )}
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="form-phone"
            value={formData.phone}
            placeholder="请输入 11 位手机号"
            disabled={isEditMode}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="form-email" className="text-sm font-medium">
          邮箱
          {isEditMode && (
            <span className="text-muted-foreground font-normal ml-1">
              （不可修改）
            </span>
          )}
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <LockIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="form-email"
            type="email"
            value={formData.email}
            placeholder="请输入邮箱地址"
            disabled={isEditMode}
            className="pl-10"
          />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">{user ? "保存" : "创建"}</Button>
      </DialogFooter>
    </form>
  );
}
// Main Component
export default function AdminUsersPage() {
  const [users] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<(typeof mockUsers)[0] | null>(
    null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const pageSize = 5;
  const filteredUsers = users.filter(
    (user) =>
      user.username.includes(searchQuery) ||
      user.phone.includes(searchQuery) ||
      user.email.includes(searchQuery),
  );
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleEdit = (user: (typeof mockUsers)[0]) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = (userId: string) => {
    console.log("Toggle status for user:", userId);
  };

  return (
    <div className="flex min-h-svh bg-muted/30">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">用户管理</h1>
              <p className="text-sm text-muted-foreground">
                管理系统内所有用户，共 {users.length} 个用户
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              新建用户
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="rounded-lg border bg-card">
            {/* Search Bar */}
            <div className="border-b p-4">
              <div className="relative max-w-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="搜索用户名、手机号或邮箱..."
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      用户名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      手机号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      邮箱
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      角色
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      创建时间
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.phone}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        {user.isSuperAdmin ? (
                          <Badge variant="default" className="gap-1">
                            <ShieldCheckIcon className="h-3 w-3" />
                            超级管理员
                          </Badge>
                        ) : (
                          <Badge variant="secondary">普通用户</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={user.isActive ? "outline" : "destructive"}
                        >
                          {user.isActive ? "正常" : "已禁用"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.createdAt}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(user)}
                            disabled={user.isSuperAdmin}
                          >
                            <EditIcon className="h-4 w-4" />
                            <span className="sr-only">编辑</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreVerticalIcon className="h-4 w-4" />
                                <span className="sr-only">更多</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.isActive ? (
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(user.id)}
                                  disabled={user.isSuperAdmin}
                                >
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  禁用用户
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(user.id)}
                                  disabled={user.isSuperAdmin}
                                >
                                  <TrashIcon className="mr-2 h-4 w-4" />
                                  启用用户
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                显示 {(currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, filteredUsers.length)} 条， 共{" "}
                {filteredUsers.length} 条
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span className="sr-only">上一页</span>
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
                  <span className="sr-only">下一页</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
            <DialogDescription>
              创建一个新的用户账号，用户将收到登录凭证
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={(data) => {
              console.log("Create user:", data);
              setIsCreateDialogOpen(false);
            }}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户信息，带有 ⚠️ 标记的字段不可修改
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={editingUser || undefined}
            onSubmit={(data) => {
              console.log("Update user:", editingUser?.id, data);
              setIsEditDialogOpen(false);
              setEditingUser(null);
            }}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingUser(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
