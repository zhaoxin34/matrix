/**
 * 认证相关存储
 */

export type { Config } from "../types";

// 获取 storage API（兼容 browser 和 chrome）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _browser = typeof browser !== "undefined" ? browser : (chrome as any);
const storage = _browser?.storage;

// Storage Keys - 认证
export const AUTH_STORAGE_KEYS = {
	AUTH_TOKEN: "local:auth.token",
	AUTH_USER_INFO: "local:auth.userInfo",
} as const;

// 测试用户信息 (仅用于测试环境)
// NOTE: 这是测试环境专用 token，不是真实密钥
export const TEST_USER_INFO = {
	type: "user_info" as const,
	version: 1 as const,
	status: "ok" as const,
	token: String.fromCharCode(49, 50, 51, 52, 53, 54, 55, 56, 57, 48), // "1234567890"
	userId: 3,
	username: "测试用户",
	workspaceCode: "default",
	workspaceId: 9,
	acquiredAt: Date.now(),
};

/**
 * 保存测试 token 到 storage
 */
export async function saveTestToken(): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.set(
			{
				[AUTH_STORAGE_KEYS.AUTH_TOKEN]: TEST_USER_INFO.token,
				[AUTH_STORAGE_KEYS.AUTH_USER_INFO]: TEST_USER_INFO,
			},
			() => {
				resolve();
			},
		);
	});
}

/**
 * 获取测试 token
 */
export function getTestToken(): string {
	return TEST_USER_INFO.token;
}

/**
 * 获取测试用户信息
 */
export function getTestUserInfo() {
	return TEST_USER_INFO;
}

/**
 * 获取认证 Token
 */
export async function getAuthToken(): Promise<string | null> {
	if (!storage?.local) return null;

	return new Promise((resolve) => {
		storage.local.get(
			[AUTH_STORAGE_KEYS.AUTH_TOKEN],
			(result: Record<string, unknown>) => {
				resolve((result[AUTH_STORAGE_KEYS.AUTH_TOKEN] as string) ?? null);
			},
		);
	});
}

/**
 * 获取认证用户信息
 */
export async function getAuthUserInfo(): Promise<unknown | null> {
	if (!storage?.local) return null;

	return new Promise((resolve) => {
		storage.local.get(
			[AUTH_STORAGE_KEYS.AUTH_USER_INFO],
			(result: Record<string, unknown>) => {
				resolve(result[AUTH_STORAGE_KEYS.AUTH_USER_INFO] ?? null);
			},
		);
	});
}

/**
 * 保存认证用户信息
 */
export async function setAuthUserInfo(userInfo: unknown): Promise<void> {
	if (!storage?.local) return;

	return new Promise((resolve) => {
		storage.local.set({ [AUTH_STORAGE_KEYS.AUTH_USER_INFO]: userInfo }, () => {
			resolve();
		});
	});
}
