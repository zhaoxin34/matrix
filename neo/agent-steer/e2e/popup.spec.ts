import { test, expect } from "./fixtures";
import { openPopup } from "./pages/popup";

test.describe("Recording UI Popup", () => {
	test("Popup 加载无错误", async ({ page, extensionId }) => {
		const popup = await openPopup(page, extensionId);

		// 检查页面加载
		const title = await popup.getTitle();
		expect(title).toBeTruthy();

		// 检查没有严重错误
		const errors = await popup.getConsoleErrors();
		// 过滤掉一些常见的非严重警告
		const criticalErrors = errors.filter(
			(e) => !e.includes("Could not load file") && !e.includes("net::ERR"),
		);
		expect(criticalErrors).toHaveLength(0);
	});

	test.describe("测试模式 (Test Mode)", () => {
		test("显示已登录状态 - Idle 视图", async ({ page, extensionId }) => {
			await openPopup(page, extensionId);

			// 测试模式下应该自动登录，显示 Idle 视图
			// Idle 视图应该有"开始录制"按钮
			const startButton = await page.waitForSelector(
				"button:has-text('开始录制')",
				{
					timeout: 5000,
				},
			);
			expect(startButton).toBeTruthy();

			// 应该显示"准备就绪"标题
			const title = await page.waitForSelector("h3:has-text('准备就绪')", {
				timeout: 5000,
			});
			expect(title).toBeTruthy();
		});

		test("点击开始录制按钮", async ({ page, extensionId }) => {
			await openPopup(page, extensionId);

			// 找到并点击开始录制按钮
			const startButton = await page.waitForSelector(
				"button:has-text('开始录制')",
			);
			await startButton.click();

			// 应该显示正在录制状态
			// 注意: 由于这是 E2E 测试，实际录制功能需要在真实浏览器中测试
			// 这里只验证按钮点击不会出错
		});

		test("打开设置页面 - 从 AuthRequired 视图", async () => {
			// 测试模式会直接显示 Idle 视图，需要通过其他方式进入设置
			// 这个测试暂时跳过，因为设置按钮在 AuthRequired 视图中
			// 在测试模式下，AuthRequired 不会被显示
			test.skip();
		});
	});

	test.describe("非测试模式 (需要 Mock)", () => {
		test.skip("显示未登录提示和设置按钮", async ({ page, extensionId }) => {
			// 这个测试需要禁用测试模式
			// 在测试模式下会被跳过
			await openPopup(page, extensionId);

			// 应该显示"打开 Neo"按钮
			const button = await page.waitForSelector("button:has-text('打开 Neo')", {
				timeout: 5000,
			});
			expect(button).toBeTruthy();

			// 应该显示设置按钮
			const settingsButton = await page.waitForSelector(
				"button:has-text('配置地址')",
				{
					timeout: 5000,
				},
			);
			expect(settingsButton).toBeTruthy();
		});
	});
});
