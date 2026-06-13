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

	test("显示未登录提示和设置按钮", async ({ page, extensionId }) => {
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

	test("点击打开 Neo 按钮", async ({ page, extensionId }) => {
		const popup = await openPopup(page, extensionId);

		// 找到并点击按钮
		await popup.clickOpenNeo();

		// 应该有新标签页打开
		const context = page.context();
		const newPage = await context.waitForEvent("page", { timeout: 5000 });
		expect(newPage.url()).toContain("localhost:3000");
	});

	test("打开设置页面", async ({ page, extensionId }) => {
		await openPopup(page, extensionId);

		// 点击设置按钮
		const settingsButton = await page.waitForSelector(
			"button:has-text('配置地址')",
		);
		await settingsButton.click();

		// 应该显示设置页面标题
		const settingsTitle = await page.waitForSelector("h2:has-text('设置')", {
			timeout: 3000,
		});
		expect(settingsTitle).toBeTruthy();

		// 应该显示两个输入框
		const inputs = await page.locator('input[type="text"]').all();
		expect(inputs.length).toBe(2);

		// 第一个输入框应该是 Neo 前端地址
		const firstValue = await inputs[0].inputValue();
		expect(firstValue).toContain("localhost:3000");

		// 第二个输入框应该是后端服务地址
		const secondValue = await inputs[1].inputValue();
		expect(secondValue).toContain("localhost:8002");
	});

	test("设置页面可以输入和取消", async ({ page, extensionId }) => {
		await openPopup(page, extensionId);

		// 打开设置页面
		const settingsButton = await page.waitForSelector(
			"button:has-text('配置地址')",
		);
		await settingsButton.click();

		// 输入新的 URL
		const input = await page.waitForSelector('input[type="text"]');
		await input.fill("http://localhost:8080");

		// 点击取消
		const cancelButton = await page.waitForSelector("button:has-text('取消')");
		await cancelButton.click();

		// 应该返回到 AuthRequired 状态
		const openNeoButton = await page.waitForSelector(
			"button:has-text('打开 Neo')",
			{ timeout: 3000 },
		);
		expect(openNeoButton).toBeTruthy();
	});
});
