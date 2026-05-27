"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User2, LogOut } from "lucide-react";
import { toast } from "sonner";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarFooter,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/hooks/use-auth-store";
import { logout as logoutApi } from "@/lib/api/auth";

export function SidebarFooterComponent() {
	const router = useRouter();
	const { user, isAuthenticated, logout: clearAuth } = useAuthStore();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		if (isLoggingOut) return;

		setIsLoggingOut(true);

		try {
			// Call logout API
			await logoutApi();
		} catch (error) {
			// Even if API fails, we still clear local state
			console.error("Logout API error:", error);
		} finally {
			// Clear auth state
			clearAuth();
			toast.success("已退出登录");
			// Redirect to login page
			router.push("/login");
			setIsLoggingOut(false);
		}
	};

	// Display name: prefer username, fallback to user_id or default
	const displayName = user?.username
		? user.username
		: user?.user_id
			? `用户${user.user_id}`
			: "张三";
	const displayEmail =
		isAuthenticated && user ? "已登录用户" : "zhangsan@example.com";

	return (
		<SidebarFooter>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[active=open]:bg-sidebar-accent data-[active=open]:text-sidebar-accent-foreground"
								tooltip={{
									children: `${displayName} ${displayEmail}`,
									side: "right",
								}}
							>
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<User2 className="size-4" />
								</div>
								<div className="grid flex-1 overflow-hidden text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
									<span className="truncate font-medium">{displayName}</span>
									<span className="truncate text-xs text-sidebar-accent-foreground/70">
										{displayEmail}
									</span>
								</div>
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							side="right"
							align="end"
							sideOffset={8}
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
										<User2 className="size-4" />
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">{displayName}</span>
										<span className="truncate text-xs text-muted-foreground">
											{displayEmail}
										</span>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem>
									<span>升级到 Pro</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem>
									<span>账户</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<span>账单</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<span>通知</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem>
									<span>设置</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleLogout}
								disabled={isLoggingOut}
								className="text-destructive focus:text-destructive cursor-pointer"
							>
								<LogOut className="mr-2 h-4 w-4" />
								<span>{isLoggingOut ? "退出中..." : "退出登录"}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarFooter>
	);
}
