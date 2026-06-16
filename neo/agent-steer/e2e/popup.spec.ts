import { test, expect } from "./fixtures";
import { openPopup } from "./pages/popup";

/**
 * E2E：Recording v2 Popup 基础验证
 *
 * - 加载无错误
 * - 测试模式下显示 Idle 视图
 * - 点击开始录制不抛错
 */

test.describe("Recording v2 Popup", () => {
	test("Popup 加载无错误", async ({ page, extensionId }) => {
		const popup = await openPopup(page, extensionId);

		// Idle 视图 h3 标题
		const title = await popup.getStatusText();
		expect(title).toBe("准备就绪");

		// 过滤非严重错误
		const errors = await popup.getConsoleErrors();
		const criticalErrors = errors.filter(
			(e) => !e.includes("Could not load file") && !e.includes("net::ERR"),
		);
		expect(criticalErrors).toHaveLength(0);
	});

	test("测试模式：显示 Idle 视图", async ({ page, extensionId }) => {
		await openPopup(page, extensionId);

		// 测试模式自动登录，进入 Idle
		const startButton = page.locator("button:has-text('开始录制')");
		await expect(startButton).toBeVisible({ timeout: 5000 });

		const title = page.locator("h3:has-text('准备就绪')");
		await expect(title).toBeVisible({ timeout: 5000 });

		// v2 关键断言：不应有"上传/清除/命名"按钮
		await expect(page.locator("button:has-text('上传')")).toHaveCount(0);
		await expect(page.locator("button:has-text('清除')")).toHaveCount(0);
	});

	test("点击开始录制不报错", async ({ context, extensionId }) => {
		const testPage = await context.newPage();
		const popupPage = await context.newPage();

		await testPage.goto("https://example.com");
		await testPage.waitForLoadState("domcontentloaded");
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForLoadState("domcontentloaded");
		await testPage.bringToFront();

		const popup = await openPopup(popupPage, extensionId);

		// 点击开始
		await popup.clickStart();

		// 等待状态切换到 recording（不卡住）
		await expect(popupPage.locator("button:has-text('停止录制')")).toBeVisible({
			timeout: 10000,
		});

		// 控制台无严重错误
		const errors = await popup.getConsoleErrors();
		const criticalErrors = errors.filter(
			(e) => !e.includes("Could not load file") && !e.includes("net::ERR"),
		);
		expect(criticalErrors).toHaveLength(0);

		await popupPage.close();
		await testPage.close();
	});

	test("非测试模式需要 mock", () => {
		// v2 流程下 popup 顶层仍复用 AuthRequiredView / SettingsView
		// 非测试模式的验证在 popup 顶层（App.tsx）层面，需要 mock iframe bridge
		// 当前测试聚焦录制模块，不在 v2 UI 第一步范围内
		test.skip();
	});
});
