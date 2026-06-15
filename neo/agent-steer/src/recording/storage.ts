/**
 * chrome.storage 封装入口
 *
 * 使用 WXT 内置 storage API: https://wxt.dev/storage.html
 */

// Re-export keys
export { STORAGE_KEYS } from "./storage.keys";

// Re-export storage operations (WXT storage)
export {
	getRecordingState,
	setRecordingState,
	getUploadProgress,
} from "./messages";

// Re-export auth functions
export { getAuthToken, getAuthUserInfo } from "../common/storage";
