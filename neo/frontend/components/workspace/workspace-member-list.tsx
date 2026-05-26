"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Add01Icon,
  Remove01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import type { WorkspaceMember } from "./workspace-types";

interface WorkspaceMemberListProps {
  members: WorkspaceMember[];
  currentUserId?: number;
  isOwner?: boolean;
  onInvite?: (email: string, role: string) => Promise<void>;
  onRemove?: (memberId: number) => Promise<void>;
  onChangeRole?: (memberId: number, role: string) => Promise<void>;
  className?: string;
}

const roleConfig: Record<
  WorkspaceMember["role"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  owner: { label: "所有者", variant: "default" },
  admin: { label: "管理员", variant: "secondary" },
  member: { label: "成员", variant: "outline" },
  guest: { label: "访客", variant: "outline" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function WorkspaceMemberList({
  members,
  currentUserId,
  isOwner = false,
  onInvite,
  onRemove,
  onChangeRole,
  className,
}: WorkspaceMemberListProps) {
  const [searchValue, setSearchValue] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [loading, setLoading] = useState(false);

  const filteredMembers = members.filter(
    (member) =>
      member.user_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      member.user_email.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !onInvite) return;
    setLoading(true);
    try {
      await onInvite(inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>成员管理</CardTitle>
          {isOwner && onInvite && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <HugeiconsIcon
                    icon={Add01Icon}
                    strokeWidth={1.5}
                    className="size-3.5 mr-1"
                  />
                  邀请成员
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>邀请成员</DialogTitle>
                  <DialogDescription>
                    从全局用户池搜索并邀请用户加入工作区。
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-xs font-medium">
                      用户邮箱 <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="输入用户邮箱"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="role" className="text-xs font-medium">
                      角色
                    </label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">管理员</SelectItem>
                        <SelectItem value="member">成员</SelectItem>
                        <SelectItem value="guest">访客</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <Button
                    onClick={handleInvite}
                    disabled={loading || !inviteEmail.trim()}
                  >
                    {loading ? "邀请中..." : "邀请"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={1.5}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          />
          <Input
            type="search"
            placeholder="搜索成员..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-none border border-border/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage
                    src={member.user_avatar}
                    alt={member.user_name}
                  />
                  <AvatarFallback>
                    {getInitials(member.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">
                      {member.user_name}
                    </span>
                    {member.user_id === currentUserId && (
                      <Badge variant="ghost" className="text-[10px] px-1 py-0">
                        你
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {member.user_email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {member.role === "owner" ? (
                  <Badge variant="default" className="text-xs">
                    所有者
                  </Badge>
                ) : isOwner && onChangeRole ? (
                  <Select
                    value={member.role}
                    onValueChange={(role) => onChangeRole(member.id, role)}
                    disabled={member.user_id === currentUserId}
                  >
                    <SelectTrigger className="w-24 h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="member">成员</SelectItem>
                      <SelectItem value="guest">访客</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {roleConfig[member.role].label}
                  </Badge>
                )}

                {member.role !== "owner" &&
                  isOwner &&
                  onRemove &&
                  member.user_id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(member.id)}
                    >
                      <HugeiconsIcon
                        icon={Remove01Icon}
                        strokeWidth={1.5}
                        className="size-4"
                      />
                    </Button>
                  )}
              </div>
            </div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {searchValue ? "未找到匹配的成员" : "暂无成员"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
