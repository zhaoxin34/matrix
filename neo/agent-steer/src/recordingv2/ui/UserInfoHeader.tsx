/**
 * UserInfoHeader - 用户信息头部组件
 *
 * 显示当前登录用户的用户名和工作区
 */

import { User, Briefcase } from "lucide-react";

interface UserInfoHeaderProps {
	username?: string;
	workspaceCode?: string;
}

export function UserInfoHeader({
	username,
	workspaceCode,
}: UserInfoHeaderProps) {
	// 如果没有用户信息，不显示
	if (!username && !workspaceCode) {
		return null;
	}

	return (
		<div className="flex items-center justify-between px-3 py-2 bg-[#1d9bf0]/10 border-b border-white/5">
			<div className="flex items-center gap-1.5 text-xs text-[#8b98a5]">
				<User className="w-3.5 h-3.5" />
				<span className="font-medium text-[#e7e9ea]">
					{username ?? "未知用户"}
				</span>
			</div>
			{workspaceCode && (
				<div className="flex items-center gap-1.5 text-xs text-[#8b98a5]">
					<Briefcase className="w-3.5 h-3.5" />
					<span>{workspaceCode}</span>
				</div>
			)}
		</div>
	);
}
