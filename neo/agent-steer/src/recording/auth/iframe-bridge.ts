/**
 * iframe-bridge - 通过隐藏 iframe 获取 Frontend 登录状态
 */

import { getConfig, TEST_USER_INFO } from "@/lib/storage";

export interface UserInfo {
	type: "user_info";
	version: 1;
	status: "ok";
	token: string;
	userId: number;
	username: string;
	workspaceCode: string;
	workspaceId: number;
	acquiredAt: number;
}

export interface AuthError {
	type: "user_info";
	version: 1;
	status: "not_authenticated" | "no_workspace";
}

export type AuthResponse = UserInfo | AuthError;

export type AuthStatus =
	| "ok"
	| "not_authenticated"
	| "no_workspace"
	| "timeout"
	| "error";

export interface AuthState {
	isAuthenticated: boolean;
	isWorkspaceSelected: boolean;
	userInfo: UserInfo | null;
	status: AuthStatus;
}

/**
 * 等待 DOM 加载完成
 */
function waitForBody(): Promise<void> {
	return new Promise((resolve) => {
		if (document.body) {
			resolve();
			return;
		}

		const timeout = setTimeout(resolve, 1000); // 最多等 1 秒

		const check = () => {
			if (document.body) {
				clearTimeout(timeout);
				resolve();
			} else {
				setTimeout(check, 10);
			}
		};
		check();
	});
}

/**
 * 通过隐藏 iframe 获取用户登录状态
 */
export async function fetchAuthState(): Promise<AuthState> {
	const config = await getConfig();

	// 测试模式：直接返回测试用户
	if (config.testMode) {
		console.log("[iframe-bridge] Test mode enabled, returning test user");
		return {
			isAuthenticated: true,
			isWorkspaceSelected: true,
			userInfo: {
				...TEST_USER_INFO,
				acquiredAt: Date.now(),
			},
			status: "ok",
		};
	}

	const iframeUrl = `${config.neoUrl}/auth-bridge/user-info`;

	return new Promise((resolve) => {
		let iframe: HTMLIFrameElement | null = null;
		let resolved = false;

		const resolveOnce = (state: AuthState) => {
			if (resolved) return;
			resolved = true;
			cleanup();
			resolve(state);
		};

		const timeout = setTimeout(() => {
			console.log("[iframe-bridge] Timeout after 5s");
			resolveOnce({
				isAuthenticated: false,
				isWorkspaceSelected: false,
				userInfo: null,
				status: "timeout",
			});
		}, 5000);

		const handleMessage = (event: MessageEvent<AuthResponse>) => {
			// 严格校验 origin
			const expectedOrigin = config.neoUrl.replace(/\/$/, "");
			const actualOrigin = event.origin.replace(/\/$/, "");

			if (actualOrigin !== expectedOrigin) {
				console.warn(
					"[iframe-bridge] Origin mismatch:",
					actualOrigin,
					"!==",
					expectedOrigin,
				);
				return;
			}

			// 校验消息类型
			const data = event.data;
			if (data?.type !== "user_info" || data?.version !== 1) {
				console.warn("[iframe-bridge] Invalid message:", data);
				return;
			}

			console.log("[iframe-bridge] Valid message received:", data.status);

			if (data.status === "ok") {
				resolveOnce({
					isAuthenticated: true,
					isWorkspaceSelected: true,
					userInfo: data as UserInfo,
					status: "ok",
				});
			} else if (data.status === "not_authenticated") {
				resolveOnce({
					isAuthenticated: false,
					isWorkspaceSelected: false,
					userInfo: null,
					status: "not_authenticated",
				});
			} else if (data.status === "no_workspace") {
				resolveOnce({
					isAuthenticated: true,
					isWorkspaceSelected: false,
					userInfo: null,
					status: "no_workspace",
				});
			}
		};

		const cleanup = () => {
			clearTimeout(timeout);
			window.removeEventListener("message", handleMessage);
			if (iframe && iframe.parentNode) {
				iframe.parentNode.removeChild(iframe);
			}
		};

		const init = async () => {
			// 等待 body 可用
			await waitForBody();

			if (resolved) return;

			// 创建隐藏 iframe
			iframe = document.createElement("iframe");
			iframe.style.cssText =
				"position:absolute;top:0;left:0;width:1px;height:1px;border:0;visibility:hidden;pointer-events:none;opacity:0;";
			iframe.src = iframeUrl;
			iframe.id = "auth-bridge-iframe";
			iframe.setAttribute("aria-hidden", "true");

			// 监听 iframe 加载（用于调试）
			iframe.onload = () => {
				console.log("[iframe-bridge] iframe loaded");
			};

			iframe.onerror = () => {
				console.error("[iframe-bridge] iframe error");
			};

			window.addEventListener("message", handleMessage);
			document.body.appendChild(iframe);
			console.log("[iframe-bridge] iframe appended, URL:", iframeUrl);
		};

		init();
	});
}
