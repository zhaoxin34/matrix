import { test, expect } from "./fixtures";

/**
 * 诊断测试：检查扩展是否能正确加载
 */
test.describe("诊断测试", () => {
	test("Popup 页面能正确加载", async ({ context, extensionId }) => {
		const popupPage = await context.newPage();

		// 打开 popup
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

		// 等待页面加载
		await popupPage.waitForTimeout(2000);

		// 获取页面内容
		const content = await popupPage.content();
		console.log("Popup HTML length:", content.length);

		// 检查是否有错误
		const errors = await popupPage.evaluate(() => {
			return (window as unknown as Record<string, unknown>).__errors || [];
		});
		console.log("Errors:", errors);

		// 截图看看
		await popupPage.screenshot({ path: "popup-screenshot.png" });

		// 获取 body 的文本
		const bodyText = await popupPage.locator("body").textContent();
		console.log("Body text:", bodyText);

		await popupPage.close();
	});
});
