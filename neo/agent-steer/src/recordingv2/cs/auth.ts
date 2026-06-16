/**
 * Recording v2 CS - 认证信息
 *
 * 从 chrome.storage.local 拿 token + workspaceCode + backendUrl。
 * 3a 阶段不做刷新 token, 401 直接抛错（调用方决定）。
 */

import { getConfig, getAuthUserInfo } from "@/common/storage";
import { logger } from "@/common/logger";
import type { ApiOptions } from "./api";

interface UserInfoShape {
	token?: string;
	workspaceCode?: string;
}

export interface AuthInfo extends ApiOptions {
	token: string;
	workspaceCode: string;
	backendUrl: string;
}

export async function getAuthInfo(): Promise<AuthInfo | null> {
	const [config, userInfoRaw] = await Promise.all([
		getConfig(),
		getAuthUserInfo(),
	]);
	const userInfo = userInfoRaw as UserInfoShape | null;
	if (!userInfo?.token || !userInfo?.workspaceCode) {
		logger.cs.warn("auth: token 或 workspaceCode 缺失");
		return null;
	}
	return {
		token: userInfo.token,
		workspaceCode: userInfo.workspaceCode,
		backendUrl: config.backendUrl,
	};
}
