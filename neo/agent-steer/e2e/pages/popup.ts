import type { Page } from "@playwright/test";

export interface PopupPage {
	// 状态验证
	getTitle: () => Promise<string | null>;
	getStatusText: () => Promise<string | null>;

	// 按钮操作
	clickStartRecording: () => Promise<void>;
	clickPause: () => Promise<void>;
	clickResume: () => Promise<void>;
	clickUpload: () => Promise<void>;
	clickCancel: () => Promise<void>;
	clickOpenNeo: () => Promise<void>;

	// 设置表单
	fillRecordingName: (name: string) => Promise<void>;
	fillInput: (index: number, value: string) => Promise<void>;

	// 控制台监听
	getConsoleErrors: () => Promise<string[]>;
}

export async function openPopup(
	page: Page,
	extensionId: string,
): Promise<PopupPage> {
	await page.goto(`chrome-extension://${extensionId}/popup.html`);

	// 等待 popup 加载
	await page.waitForSelector(".recording-ui", { timeout: 5000 });

	const errors: string[] = [];

	// 监听控制台错误
	page.on("console", (msg) => {
		if (msg.type() === "error") {
			errors.push(msg.text());
		}
	});

	return {
		getTitle: async () => {
			// 尝试获取 h3 标题（shadcn UI 使用 h3）
			const h3 = await page.waitForSelector("h3", { timeout: 3000 });
			return h3?.textContent();
		},

		getStatusText: async () => {
			const h3 = await page.waitForSelector("h3", { timeout: 3000 });
			return h3?.textContent();
		},

		clickStartRecording: async () => {
			const button = await page.waitForSelector("button:has-text('开始录制')");
			await button.click();
		},

		clickPause: async () => {
			const button = await page.waitForSelector("button:has-text('暂停')");
			await button.click();
		},

		clickResume: async () => {
			const button = await page.waitForSelector("button:has-text('继续录制')");
			await button.click();
		},

		clickUpload: async () => {
			const button = await page.waitForSelector("button:has-text('上传')");
			await button.click();
		},

		clickCancel: async () => {
			const button = await page.waitForSelector("button:has-text('取消')");
			await button.click();
		},

		clickOpenNeo: async () => {
			const button = await page.waitForSelector("button:has-text('打开 Neo')");
			await button.click();
		},

		fillRecordingName: async (name: string) => {
			const input = await page.waitForSelector('input[type="text"]');
			await input.fill(name);
		},

		fillInput: async (index: number, value: string) => {
			const inputs = await page.locator('input[type="text"]').all();
			if (inputs[index]) {
				await inputs[index].fill(value);
			}
		},

		getConsoleErrors: async () => errors,
	};
}
