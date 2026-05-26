"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getUserList,
  createUser,
  updateUser,
  updateUserStatus,
  getErrorMessage,
} from "@/lib/api/auth";
import {
  createUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from "@/schemas/auth";
import type { User, UpdateUserRequest } from "@/types/auth";

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

function MailIcon({ className }: { className?: string }) {
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
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

function _UnlockIcon({ className }: { className?: string }) {
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
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
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

function LoaderIcon({ className }: { className?: string }) {
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
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// User Form Component
function UserForm({
  user,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  user?: User;
  onSubmit: (data: CreateUserFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const isEditMode = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: user?.username || "",
      phone: user?.phone || "",
      email: user?.email || "",
    },
  });

  const onFormSubmit = (data: CreateUserFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {!isEditMode && (
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
              data-testid="inp-form-username"
              {...register("username")}
              placeholder="请输入用户名"
              className="pl-10"
            />
          </div>
          {errors.username && (
            <p className="text-xs text-destructive">
              {errors.username.message as string}
            </p>
          )}
        </div>
      )}

      {!isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="form-phone" className="text-sm font-medium">
            手机号
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id="form-phone"
              type="tel"
              data-testid="inp-form-phone"
              maxLength={11}
              {...register("phone")}
              placeholder="请输入 11 位手机号"
              className="pl-10"
            />
          </div>
          {(errors as Record<string, { message?: string }>).phone && (
            <p className="text-xs text-destructive">
              {
                (errors as Record<string, { message?: string }>).phone
                  ?.message as string
              }
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="form-email" className="text-sm font-medium">
          邮箱
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MailIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="form-email"
            type="email"
            data-testid="inp-form-email"
            {...register("email")}
            placeholder="请输入邮箱地址"
            className="pl-10"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive">
            {errors.email.message as string}
          </p>
        )}
      </div>

      {isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="form-username-edit" className="text-sm font-medium">
            用户名
          </Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id="form-username-edit"
              data-testid="inp-form-username"
              {...register("username")}
              placeholder="请输入用户名"
              className="pl-10"
            />
          </div>
          {errors.username && (
            <p className="text-xs text-destructive">
              {errors.username.message as string}
            </p>
          )}
        </div>
      )}

      <DialogFooter className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="btn-form-submit"
        >
          {isSubmitting ? (
            <>
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : user ? (
            "保存"
          ) : (
            "创建"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Main Component
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUserList({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery,
      });
      if (response.code === 0) {
        setUsers(response.data.list);
        setTotal(response.data.total);
      } else {
        toast.error(getErrorMessage(response.code));
      }
    } catch {
      toast.error("获取用户列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await getUserList({
          page: currentPage,
          page_size: pageSize,
          search: searchQuery,
        });
        if (response.code === 0) {
          setUsers(response.data.list);
          setTotal(response.data.total);
        } else {
          toast.error(getErrorMessage(response.code));
        }
      } catch {
        toast.error("获取用户列表失败");
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, [currentPage, pageSize, searchQuery]);

  const totalPages = Math.ceil(total / pageSize);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleCreateUser = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      const response = await createUser(data);
      if (response.code === 0) {
        toast.success("用户创建成功");
        setIsCreateDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(getErrorMessage(response.code));
      }
    } catch {
      toast.error("创建用户失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (data: UpdateUserFormData) => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const response = await updateUser(
        editingUser.id,
        data as UpdateUserRequest,
      );
      if (response.code === 0) {
        toast.success("用户信息已更新");
        setIsEditDialogOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(getErrorMessage(response.code));
      }
    } catch {
      toast.error("更新用户失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await updateUserStatus(user.id, {
        is_active: !user.is_active,
      });
      if (response.code === 0) {
        toast.success(user.is_active ? "用户已禁用" : "用户已启用");
        fetchUsers();
      } else {
        toast.error(getErrorMessage(response.code));
      }
    } catch {
      toast.error("操作失败");
    }
  };

  return (
    <div className="flex min-h-full bg-muted/30">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">用户管理</h1>
              <p className="text-sm text-muted-foreground">
                管理系统内所有用户，共 {total} 个用户
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="btn-create-user"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              新建用户
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="border bg-card">
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
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        <LoaderIcon className="mx-auto h-6 w-6 animate-spin" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        暂无用户数据
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10">
                              <UserIcon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">
                              {user.username || "未设置"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{user.phone}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {user.email || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {user.is_admin ? (
                            <Badge variant="default" className="gap-1">
                              <ShieldCheckIcon className="h-3 w-3" />
                              管理员
                            </Badge>
                          ) : (
                            <Badge variant="secondary">普通用户</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={user.is_active ? "outline" : "destructive"}
                          >
                            {user.is_active ? "正常" : "已禁用"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(user)}
                              disabled={user.is_admin}
                              data-testid={`btn-edit-${user.id}`}
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
                                {user.is_active ? (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(user)}
                                    disabled={user.is_admin}
                                  >
                                    <TrashIcon className="mr-2 h-4 w-4" />
                                    禁用用户
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(user)}
                                    disabled={user.is_admin}
                                  >
                                    <_UnlockIcon className="mr-2 h-4 w-4" />
                                    启用用户
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                显示 {(currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, total)} 条， 共 {total} 条
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
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
                  disabled={currentPage >= totalPages || isLoading}
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
            onSubmit={handleCreateUser}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          <UserForm
            user={editingUser || undefined}
            onSubmit={handleUpdateUser}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingUser(null);
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
