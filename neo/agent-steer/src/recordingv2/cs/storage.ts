/**
 * Recording v2 CS - 持久化
 *
 * 3c 范围：
 *   - recordingUid: 重启续传 + 跨 tab 接管
 *   - lastStartAt:  用于生成 recording name
 *
 * 浏览器侧唯一持久化数据。Segment 数据不在 chrome.storage 留底。
 */

import { logger } from "@/common/logger";

const KEY_RECORDING_UID = "local:recording.recordingUid";
const KEY_LAST_START_AT = "local:recording.lastStartAt";

export async function saveRecordingState(uid: string, startAt: number): Promise<void> {
	await chrome.storage.local.set({
		[KEY_RECORDING_UID]: uid,
		[KEY_LAST_START_AT]: startAt,
	});
	logger.cs.debug("storage: recording state saved", { uid, startAt });
}

export async function loadRecordingUid(): Promise<string | null> {
	const result = await chrome.storage.local.get(KEY_RECORDING_UID);
	const uid = result[KEY_RECORDING_UID];
	return typeof uid === "string" ? uid : null;
}

export async function clearRecordingState(): Promise<void> {
	await chrome.storage.local.remove([KEY_RECORDING_UID, KEY_LAST_START_AT]);
	logger.cs.debug("storage: recording state cleared");
}
