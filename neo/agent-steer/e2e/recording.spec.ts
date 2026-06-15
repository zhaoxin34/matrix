import { test, expect } from "./fixtures";

/**
 * E2E 测试：录制功能
 *
 * 测试录制流程（根据 design/docs/product/agent-steer/recording.md）
 */

test.describe("录制功能 E2E", () => {
	test("1. 初始状态应该是 Idle", async ({ context, extensionId }) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 等待 popup 加载
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});

		// 检查是否有"开始录制"按钮（Idle 状态）
		const hasStartButton = await popupPage
			.locator("button:has-text('开始录制')")
			.isVisible()
			.catch(() => false);

		expect(hasStartButton).toBeTruthy();

		await popupPage.close();
		await testPage.close();
	});

	test("2. 开启录制 - 点击开始录制后变成录制中状态", async ({
		context,
		extensionId,
	}) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 在操作前让 testPage 获得焦点
		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		// 点击开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");

		// 等待状态变化
		await popupPage.waitForTimeout(3000);

		// 检查是否显示录制中
		const hasRecordingIndicator = await popupPage
			.locator("text=录制中")
			.isVisible()
			.catch(() => false);
		const hasStopButton = await popupPage
			.locator("button:has-text('停止')")
			.isVisible()
			.catch(() => false);
		const hasPauseButton = await popupPage
			.locator("button:has-text('暂停')")
			.isVisible()
			.catch(() => false);

		// 应该显示录制中状态
		expect(
			hasRecordingIndicator || hasStopButton || hasPauseButton,
		).toBeTruthy();

		await popupPage.close();
		await testPage.close();
	});

	test("3. 暂停录制 - 点击暂停后显示继续和上传按钮", async ({
		context,
		extensionId,
	}) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 让 testPage 获得焦点
		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		// 先开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await testPage.waitForTimeout(2000);

		// 点击暂停
		await popupPage.click("button:has-text('暂停')");
		await testPage.waitForTimeout(2000);

		// 检查是否显示已暂停
		const hasPausedIndicator = await popupPage
			.locator("text=已暂停")
			.isVisible()
			.catch(() => false);
		const hasResumeButton = await popupPage
			.locator("button:has-text('继续')")
			.isVisible()
			.catch(() => false);
		const hasUploadButton = await popupPage
			.locator("button:has-text('上传')")
			.isVisible()
			.catch(() => false);

		// 应该显示暂停状态和操作按钮
		expect(hasPausedIndicator || hasResumeButton).toBeTruthy();
		expect(hasUploadButton).toBeTruthy();

		await popupPage.close();
		await testPage.close();
	});

	test("4. 继续录制 - 点击继续后恢复录制", async ({ context, extensionId }) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 让 testPage 获得焦点
		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		// 开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await testPage.waitForTimeout(2000);

		// 暂停
		await popupPage.click("button:has-text('暂停')");
		await testPage.waitForTimeout(1000);

		// 点击继续
		await popupPage.click("button:has-text('继续')");
		await testPage.waitForTimeout(2000);

		// 检查是否恢复录制状态
		const hasRecordingIndicator = await popupPage
			.locator("text=录制中")
			.isVisible()
			.catch(() => false);
		const hasPauseButton = await popupPage
			.locator("button:has-text('暂停')")
			.isVisible()
			.catch(() => false);

		expect(hasRecordingIndicator || hasPauseButton).toBeTruthy();

		await popupPage.close();
		await testPage.close();
	});

	test("5. 停止录制 - 点击停止后显示上传或开始录制", async ({
		context,
		extensionId,
	}) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 让 testPage 获得焦点
		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		// 开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await testPage.waitForTimeout(2000);

		// 执行一些操作让 segment 有内容
		for (let i = 0; i < 3; i++) {
			await testPage.evaluate(() => {
				const el = document.createElement("div");
				el.className = "test-element";
				document.body.appendChild(el);
			});
			await testPage.waitForTimeout(200);
		}

		// 点击停止
		await popupPage.click("button:has-text('停止')");
		await testPage.waitForTimeout(2000);

		// 状态应该显示开始录制按钮或上传按钮（取决于 segment 是否保存）
		const hasStartButton = await popupPage
			.locator("button:has-text('开始录制')")
			.isVisible()
			.catch(() => false);
		const hasUploadButton = await popupPage
			.locator("button:has-text('上传')")
			.isVisible()
			.catch(() => false);

		expect(hasStartButton || hasUploadButton).toBeTruthy();

		await popupPage.close();
		await testPage.close();
	});

	test("6. 关闭 popup 再打开 - 录制状态应该保持", async ({
		context,
		extensionId,
	}) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 让 testPage 获得焦点
		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		// 开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await testPage.waitForTimeout(3000);

		// 关闭 popup
		await popupPage.close();

		// 重新打开 popup
		const newPopupPage = await context.newPage();
		await newPopupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await newPopupPage.waitForTimeout(2000);

		// 状态应该保持录制中
		const hasRecordingIndicator = await newPopupPage
			.locator("text=录制中")
			.isVisible()
			.catch(() => false);
		const hasStopButton = await newPopupPage
			.locator("button:has-text('停止')")
			.isVisible()
			.catch(() => false);

		expect(hasRecordingIndicator || hasStopButton).toBeTruthy();

		await newPopupPage.close();
		await testPage.close();
	});

	test("7. 录制过程中时间应该实时更新", async ({ context, extensionId }) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 让 testPage 获得焦点
		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		// 开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await popupPage.waitForTimeout(3000);

		// 检查是否显示时长 (格式可能是 MM:SS 或 HH:MM:SS)
		const durationText = await popupPage
			.locator("text=/\\d{1,2}:\\d{2}(:\\d{2})?/")
			.first()
			.textContent()
			.catch(() => "");

		// 应该显示非零时长
		expect(durationText).toBeTruthy();
		expect(durationText).not.toBe("00:00:00");

		await popupPage.close();
		await testPage.close();
	});

	test("8. 切 tab 不停止录制 - 录制继续进行", async ({
		context,
		extensionId,
	}) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 让 testPage 获得焦点
		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		// 开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await testPage.waitForTimeout(2000);

		// 切到另一个 tab
		const newTab = await context.newPage();
		await newTab.goto("https://example.org");
		await newTab.waitForTimeout(2000);

		// 切回原 tab
		await testPage.bringToFront();
		await popupPage.waitForTimeout(2000);

		// 检查是否仍在录制
		const hasRecordingIndicator = await popupPage
			.locator("text=录制中")
			.isVisible()
			.catch(() => false);

		expect(hasRecordingIndicator).toBeTruthy();

		await newTab.close();
		await popupPage.close();
		await testPage.close();
	});

	test("9. rrweb 和 recorder 都正确加载到页面", async ({ context }) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(3000);

		// 检查 rrweb 是否已加载
		const hasRRWeb = await testPage.evaluate(() => {
			return (
				typeof (window as unknown as Record<string, unknown>).rrwebRecord !==
				"undefined"
			);
		});

		expect(hasRRWeb).toBeTruthy();

		// 检查 recorder 是否已初始化
		const hasRecorder = await testPage.evaluate(() => {
			return (
				typeof (window as unknown as Record<string, unknown>)
					.__recorderInitialized !== "undefined"
			);
		});

		expect(hasRecorder).toBeTruthy();

		await testPage.close();
	});
});
