"use client";

import { useState, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TestUser {
	id: number;
	phone: string;
	username?: string;
	is_active: boolean;
}

// 硬编码的测试数据 - 不需要后端
const MOCK_USERS: TestUser[] = [
	{ id: 1, phone: "138****0001", username: "张三", is_active: true },
	{ id: 2, phone: "138****0002", username: "李四", is_active: true },
	{ id: 3, phone: "138****0003", username: "王五", is_active: false },
	{ id: 4, phone: "138****0004", username: "赵六", is_active: true },
	{ id: 5, phone: "138****0005", username: "", is_active: true },
];

interface UserSelectorV2Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (user: TestUser) => void;
}

export function UserSelectorV2({
	open,
	onOpenChange,
	onSelect,
}: UserSelectorV2Props) {
	const [search, setSearch] = useState("");
	const [selectedUser, setSelectedUser] = useState<TestUser | null>(null);

	// Remove debug console.log statements while keeping the function
	const handleUserSelect = useCallback((user: TestUser) => {
		setSelectedUser(user);
	}, []);

	const handleConfirm = useCallback(() => {
		if (selectedUser) {
			onSelect(selectedUser);
			onOpenChange(false);
			setSearch("");
			setSelectedUser(null);
		}
	}, [selectedUser, onSelect, onOpenChange]);

	const handleCancel = useCallback(() => {
		onOpenChange(false);
		setSearch("");
		setSelectedUser(null);
	}, [onOpenChange]);

	// 简单的过滤
	const filteredUsers = MOCK_USERS.filter((user) => {
		if (!search) return true;
		const s = search.toLowerCase();
		return (
			user.phone.toLowerCase().includes(s) ||
			user.username?.toLowerCase().includes(s)
		);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>选择用户 (V2)</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<Input
						placeholder="搜索手机号、用户名..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<div className="max-h-[300px] overflow-y-auto rounded-md border">
						{filteredUsers.length === 0 ? (
							<div className="py-6 text-center text-sm text-muted-foreground">
								未找到匹配的用户
							</div>
						) : (
							<div className="p-2">
								{filteredUsers.map((user) => (
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
							完成 ({selectedUser?.phone || "未选择"})
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						当前选中:{" "}
						{selectedUser
							? `${selectedUser.phone} ${selectedUser.username || ""}`
							: "无"}
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
