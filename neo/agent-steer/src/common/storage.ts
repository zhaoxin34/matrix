/**
 * chrome.storage 封装入口
 *
 * 模块划分:
 * - storage.local/auth.ts     - 认证相关 (token, userInfo)
 * - storage.local/sysconfig.ts - 系统配置
 */

// Re-export Config for convenience
export type { Config } from "./storage.local/auth";

// Re-export sysconfig functions
export {
	DEFAULT_CONFIG,
	getConfig,
	setConfig,
	saveConfig,
} from "./storage.local/sysconfig";

// Re-export auth functions
export {
	AUTH_STORAGE_KEYS,
	TEST_USER_INFO,
	saveTestToken,
	getTestToken,
	getTestUserInfo,
	getAuthToken,
	getAuthUserInfo,
	setAuthUserInfo,
} from "./storage.local/auth";
