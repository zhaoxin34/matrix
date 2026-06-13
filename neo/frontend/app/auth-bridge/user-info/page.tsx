/**
 * Auth Bridge - User Info Endpoint
 *
 * Chrome Extension 通过隐藏 iframe 嵌入此页面，获取当前用户的认证信息。
 * 页面挂载时，从 frontend 的 store 读取用户和 workspace 信息，
 * 通过 postMessage 发送给 parent window。
 *
 * Security: Extension 端会严格校验 event.origin，因此此页面不需要防御伪造调用。
 *
 * See design/docs/technical/auth/iframe-bridge.md
 */

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { useOrganizationStore } from "@/hooks/use-organization-store";

const PROTOCOL_VERSION = 1;
const MESSAGE_TYPE = "user_info";

type Status = "ok" | "not_authenticated" | "no_workspace";

export default function AuthBridgeUserInfoPage() {
	const user = useAuthStore((s) => s.user);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
	const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
	const hasOrgId = useWorkspaceStore((s) => s.hasOrgId);
	const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
	const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);
	const loadOrgUnits = useOrganizationStore((s) => s.loadOrgUnits);

	// 当 currentWorkspaceId 存在但 currentWorkspace 为 null 时，尝试恢复 workspace
	useEffect(() => {
		if (
			currentWorkspaceId &&
			!currentWorkspace &&
			!hasOrgId &&
			!selectedOrgId
		) {
			loadOrgUnits();
		}
	}, [
		currentWorkspaceId,
		currentWorkspace,
		hasOrgId,
		selectedOrgId,
		loadOrgUnits,
	]);

	// 当 orgId 变化时加载 workspaces
	useEffect(() => {
		if (selectedOrgId) {
			loadWorkspaces(selectedOrgId);
		}
	}, [selectedOrgId, loadWorkspaces]);

	// 发送 postMessage
	useEffect(() => {
		let status: Status = "not_authenticated";
		if (isAuthenticated && user) {
			status = currentWorkspace ? "ok" : "no_workspace";
		}

		const payload: Record<string, unknown> = {
			type: MESSAGE_TYPE,
			version: PROTOCOL_VERSION,
			status,
		};
		if (status === "ok" && user && currentWorkspace) {
			payload.token = user.token;
			payload.userId = user.user_id;
			payload.username = user.username;
			payload.workspaceCode = currentWorkspace.code;
			payload.workspaceId = currentWorkspace.id;
			payload.acquiredAt = Date.now();
		}

		// 使用 "*" 作为 targetOrigin - 安全性依赖 Extension 端的 origin 校验
		window.parent.postMessage(payload, "*");
	}, [isAuthenticated, user, currentWorkspace]);

	let message: string;
	if (!isAuthenticated) message = "请先登录 Neo";
	else if (!currentWorkspace) message = "请先选择工作区";
	else message = "已连接 Auth Bridge";

	return (
		<div
			style={{
				padding: 8,
				fontSize: 12,
				color: "#666",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			{message}
		</div>
	);
}
