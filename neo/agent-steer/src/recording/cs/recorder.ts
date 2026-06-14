/**
 * Content Script Recorder Module
 *
 * 注意: 录制逻辑现在直接在 entrypoints/content.ts 中实现，
 * 因为 @rrweb/record 只能在 Content Script 环境中使用。
 *
 * 此模块保留为空，以保持 API 兼容性。
 */

// 录制逻辑已在 entrypoints/content.ts 中实现
// 不需要额外的封装层

export async function initRecorder(): Promise<void> {
	// 录制逻辑在 content.ts 中初始化
	console.log("[recorder] Recording is handled by content.ts");
}

export function cleanup(): void {
	// 清理逻辑在 content.ts 中处理
}

export async function startRecording(): Promise<void> {
	// 由 content.ts 通过 storage 命令处理
}

export async function pauseRecording(): Promise<void> {
	// 由 content.ts 通过 storage 命令处理
}

export async function resumeRecording(): Promise<void> {
	// 由 content.ts 通过 storage 命令处理
}

export async function stopRecording(): Promise<void> {
	// 由 content.ts 通过 storage 命令处理
}
