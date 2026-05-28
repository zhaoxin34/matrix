"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UnlinkedUser } from "@/types/organization";
import { getUnlinkedUsers } from "@/lib/api/organization";

interface UserSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (user: UnlinkedUser) => void;
}

export function UserSelector({
  open,
  onOpenChange,
  onSelect,
}: UserSelectorProps) {
  const [users, setUsers] = useState<UnlinkedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UnlinkedUser | null>(null);

  // Use ref to track if component is still mounted
  const isMounted = useRef(true);

  const handleConfirm = useCallback(() => {
    if (selectedUser) {
      onSelect(selectedUser);
      onOpenChange(false);
      setSearch("");
      setSelectedUser(null);
    }
  }, [selectedUser, onSelect, onOpenChange]);

  const handleUserSelect = useCallback((user: UnlinkedUser) => {
    setSelectedUser(user);
  }, []);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    setSearch("");
    setSelectedUser(null);
  }, [onOpenChange]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const result = await getUnlinkedUsers({
          page: 1,
          page_size: 50,
          search: search || undefined,
        });
        if (isMounted.current) {
          setUsers(result.list);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
        if (isMounted.current) {
          setUsers([]);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadUsers();
  }, [open, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>选择用户</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="搜索手机号、用户名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-[300px] overflow-y-auto rounded-md border">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                加载中...
              </div>
            ) : users.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {search ? "未找到匹配的用户" : "暂无可关联的用户"}
              </div>
            ) : (
              <div className="p-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? "bg-muted"
                        : "hover:bg-muted/50"
                    } ${!user.is_active ? "opacity-50" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{user.phone}</span>
                      {user.username && (
                        <span className="text-sm text-muted-foreground">
                          {user.username}
                        </span>
                      )}
                    </div>
                    {!user.is_active && (
                      <span className="text-xs text-muted-foreground">
                        (已禁用)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedUser}>
              完成
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            请选择一个未关联的用户。选择后，用户信息将自动填充到表单中。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
