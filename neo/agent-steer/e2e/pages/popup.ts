import type { Page } from "@playwright/test";

/**
 * Popup helper (v2)
 *
 * v2 流程：开始 / 暂停 / 恢复 / 停止
 * v1 的"上传 / 清除 / 命名"已删除。
 */

export interface PopupPage {
	// 状态验证
	getStatusText: () => Promise<string | null>;
	getCurrentStatus: () => Promise<"idle" | "recording" | "paused" | "unknown">;

	// 录制控制
	clickStart: () => Promise<void>;
	clickPause: () => Promise<void>;
	clickResume: () => Promise<void>;
	clickStop: () => Promise<void>;

	// 控制台监听
	getConsoleErrors: () => Promise<string[]>;
}

export async function openPopup(
	page: Page,
	extensionId: string,
): Promise<PopupPage> {
	await page.goto(`chrome-extension://${extensionId}/popup.html`);
	await page.waitForSelector(".recording-ui", { timeout: 5000 });

	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") errors.push(msg.text());
	});

	return {
		getStatusText: async () => {
			const h3 = await page.waitForSelector("h3", { timeout: 3000 });
			return h3?.textContent();
		},

		getCurrentStatus: async () => {
			// 通过"开始录制"按钮存在性判断 idle
			const startVisible = await page
				.locator("button:has-text('开始录制')")
				.isVisible()
				.catch(() => false);
			if (startVisible) return "idle";

			// 通过录制中/已暂停文字判断
			const recordingVisible = await page
				.locator("text=录制中")
				.isVisible()
				.catch(() => false);
			if (recordingVisible) return "recording";

			const pausedVisible = await page
				.locator("text=已暂停")
				.isVisible()
				.catch(() => false);
			if (pausedVisible) return "paused";

			return "unknown";
		},

		clickStart: async () => {
			const button = await page.waitForSelector(
				"button:has-text('开始录制')",
				{ timeout: 5000 },
			);
			await button.click();
		},

		clickPause: async () => {
			const button = await page.waitForSelector(
				"button:has-text('暂停录制')",
				{ timeout: 5000 },
			);
			await button.click();
		},

		clickResume: async () => {
			const button = await page.waitForSelector(
				"button:has-text('继续录制')",
				{ timeout: 5000 },
			);
			await button.click();
		},

		clickStop: async () => {
			const button = await page.waitForSelector(
				"button:has-text('停止录制')",
				{ timeout: 5000 },
			);
			await button.click();
		},

		getConsoleErrors: async () => errors,
	};
}
