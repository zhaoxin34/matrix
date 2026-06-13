/**
 * Frontend page used by the Agent Steer chrome extension.
 *
 * The extension embeds this page in a hidden iframe inside its popup.
 * On mount, we read the current user + workspace from the frontend's
 * stores and `postMessage` the data back to the parent window so the
 * extension can authenticate backend API calls.
 *
 * Security: the extension validates `event.origin` strictly against its
 * configured `frontend_base_url` before trusting the payload, so this
 * page does not need to defend against spoofed callers.
 *
 * See openspec/changes/agent-steer-recording/design.md §7.5.3.
 */

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

const PROTOCOL_VERSION = 1;
const MESSAGE_TYPE = "agent_steer_user_info";

type Status = "ok" | "not_authenticated" | "no_workspace";

export default function AgentSteerUserInfoPage() {
	const user = useAuthStore((s) => s.user);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

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

		// Use "*" — the parent (chrome extension) validates the origin against
		// its configured frontend_base_url before trusting the payload.
		window.parent.postMessage(payload, "*");
	}, [isAuthenticated, user, currentWorkspace]);

	let message: string;
	if (!isAuthenticated) message = "请先登录 Neo";
	else if (!currentWorkspace) message = "请先选择工作区";
	else message = "已连接 Agent Steer";

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
