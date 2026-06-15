import { test, expect } from "./fixtures";

/**
 * E2E 测试：录制到上传完整流程
 *
 * 注意：上传到 Neo Backend 需要后端服务运行。
 * 这里测试录制、segment 保存、以及上传输入界面的流程。
 */
test.describe("录制到上传完整流程", () => {
	test("完整录制流程：开始 -> 操作 -> 暂停 -> 显示输入名称界面 -> 输入名称", async ({
		context,
		extensionId,
	}) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(3000);

		// 监听控制台日志
		const logs: string[] = [];
		testPage.on("console", (msg) => {
			logs.push(`[${msg.type()}] ${msg.text()}`);
		});

		// 打开 popup
		const popupPage = await context.newPage();
		popupPage.on("console", (msg) => {
			logs.push(`[popup-${msg.type()}] ${msg.text()}`);
		});
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		// 让 testPage 获得焦点
		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		console.log("\n=== 步骤 1: 开始录制 ===");
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await testPage.waitForTimeout(2000);

		const isRecording = await popupPage
			.locator("text=录制中")
			.isVisible()
			.catch(() => false);
		expect(isRecording).toBeTruthy();
		console.log("✓ 录制已启动");

		console.log("\n=== 步骤 2: 执行页面操作 ===");
		for (let i = 0; i < 5; i++) {
			await testPage.evaluate(() => {
				const el = document.createElement("div");
				el.className = "test-element";
				document.body.appendChild(el);
			});
			await testPage.waitForTimeout(300);
		}
		console.log("✓ 执行了页面操作");

		console.log("\n=== 步骤 3: 暂停录制 ===");
		await popupPage.click("button:has-text('暂停')");
		await testPage.waitForTimeout(2000);

		const isPaused = await popupPage
			.locator("text=已暂停")
			.isVisible()
			.catch(() => false);
		expect(isPaused).toBeTruthy();
		console.log("✓ 录制已暂停");

		console.log("\n=== 步骤 4: 点击上传 ===");
		await popupPage.click("button:has-text('上传')");
		await testPage.waitForTimeout(1000);

		// 打印 popup 内容用于调试
		const popupContent = await popupPage.content();
		console.log("Popup HTML 片段:", popupContent.substring(0, 2000));

		// 验证显示输入名称界面
		const hasInputField = await popupPage
			.locator("input[placeholder='输入录像名称']")
			.isVisible()
			.catch(() => false);
		expect(hasInputField).toBeTruthy();
		console.log("✓ 显示输入名称界面");

		console.log("\n=== 步骤 5: 输入名称 ===");
		await popupPage.fill("input[placeholder='输入录像名称']", "测试录像");
		await popupPage.waitForTimeout(200);

		// 验证输入成功
		const inputValue = await popupPage.inputValue(
			"input[placeholder='输入录像名称']",
		);
		expect(inputValue).toBe("测试录像");
		console.log("✓ 已输入录像名称");

		console.log("\n=== 步骤 6: 点击确认上传 ===");
		await popupPage.click("button:has-text('确认上传')");
		await testPage.waitForTimeout(500);

		// 验证进入上传中状态
		const isUploading = await popupPage
			.locator("text=上传中")
			.isVisible()
			.catch(() => false);
		expect(isUploading).toBeTruthy();
		console.log("✓ 进入上传中状态");

		// 验证日志中有上传相关日志
		const uploadCalled = logs.some(
			(log) => log.includes("confirmUpload") || log.includes("upload"),
		);
		console.log("上传相关日志:", uploadCalled);

		await popupPage.close();
		await testPage.close();
	});

	test("停止录制后显示上传按钮", async ({ context, extensionId }) => {
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		const logs: string[] = [];
		testPage.on("console", (msg) => {
			logs.push(`[${msg.type()}] ${msg.text()}`);
		});

		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

		await testPage.bringToFront();
		await testPage.waitForTimeout(500);

		// 开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await testPage.waitForTimeout(2000);

		// 执行操作
		for (let i = 0; i < 3; i++) {
			await testPage.evaluate(() => {
				const el = document.createElement("div");
				el.className = "test-element";
				document.body.appendChild(el);
			});
			await testPage.waitForTimeout(200);
		}

		// 停止录制
		await popupPage.click("button:has-text('停止')");
		await testPage.waitForTimeout(2000);

		// 验证 segment 被保存
		const segmentFlushed = logs.some((log) => log.includes("Segment flushed"));
		expect(segmentFlushed).toBeTruthy();
		console.log("✓ Segment 已保存");

		// 验证上传按钮显示
		const hasUploadButton = await popupPage
			.locator("button:has-text('上传')")
			.isVisible()
			.catch(() => false);
		expect(hasUploadButton).toBeTruthy();
		console.log("✓ 上传按钮已显示");

		await popupPage.close();
		await testPage.close();
	});

	test("取消上传返回", async ({ context, extensionId }) => {
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(2000);

		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForTimeout(1000);

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
		await testPage.waitForTimeout(2000);

		// 点击上传
		await popupPage.click("button:has-text('上传')");
		await testPage.waitForTimeout(500);

		// 验证显示输入界面
		const hasInput = await popupPage
			.locator("input[placeholder='输入录像名称']")
			.isVisible()
			.catch(() => false);
		expect(hasInput).toBeTruthy();
		console.log("✓ 显示输入名称界面");

		// 点击返回
		await popupPage.click("button:has-text('返回')");
		await testPage.waitForTimeout(500);

		// 验证返回到暂停状态
		const isPaused = await popupPage
			.locator("text=已暂停")
			.isVisible()
			.catch(() => false);
		expect(isPaused).toBeTruthy();
		console.log("✓ 取消后返回到暂停状态");

		await popupPage.close();
		await testPage.close();
	});
});
