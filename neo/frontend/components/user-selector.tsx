"use client";

import { useState, useEffect } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

	// Use ref to track if component is still mounted
	const isMounted = useRef(true);

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

	const handleSelect = (user: UnlinkedUser) => {
		onSelect(user);
		onOpenChange(false);
		setSearch("");
	};

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
					<div className="max-h-[300px] overflow-hidden rounded-md border">
						<Command>
							<CommandList>
								{loading ? (
									<CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
										加载中...
									</CommandEmpty>
								) : users.length === 0 ? (
									<CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
										{search ? "未找到匹配的用户" : "暂无可关联的用户"}
									</CommandEmpty>
								) : (
									<CommandGroup>
										{users.map((user) => (
											<CommandItem
												key={user.id}
												onSelect={() => handleSelect(user)}
												className="flex items-center justify-between py-3 cursor-pointer"
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
											</CommandItem>
										))}
									</CommandGroup>
								)}
							</CommandList>
						</Command>
					</div>
					<p className="text-xs text-muted-foreground">
						请选择一个未关联的用户。选择后，用户信息将自动填充到表单中。
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Import useRef
import { useRef } from "react";
