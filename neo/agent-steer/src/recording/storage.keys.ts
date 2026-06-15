// Storage Keys - Recording 模块专用
// 与 chrome.storage.local 的 key 对应，需要加上 "local:" 前缀
export const STORAGE_KEYS = {
	RECORDING_STATE: "local:recording.state",
	UPLOAD_CMD: "local:recording.uploadCmd",
	UPLOAD_PROGRESS: "local:recording.uploadProgress",
} as const;
