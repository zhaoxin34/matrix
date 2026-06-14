import { test, expect } from "./fixtures";

/**
 * E2E 测试：录制功能
 *
 * 测试录制流程：
 * 1. 打开 popup 并开始录制
 * 2. 验证录制状态
 * 3. 停止录制
 * 4. 验证 segments 写入 IndexedDB
 */
test.describe("录制功能 E2E", () => {
	test("完整录制流程 - 通过 popup", async ({ context, extensionId }) => {
		// 打开测试页面
		const testPage = await context.newPage();

		// 监听测试页面的控制台日志
		const testPageLogs: string[] = [];
		testPage.on("console", (msg) => {
			testPageLogs.push(`[${msg.type()}] ${msg.text()}`);
		});

		await testPage.goto("https://example.com");

		// 等待 content script 和 recorder 初始化
		await testPage.waitForTimeout(3000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForSelector(".recording-ui");

		// 点击开始录制
		await popupPage.click("button:has-text('开始录制')");

		// 等待 10 秒让录制开始
		await testPage.waitForTimeout(10000);

		// 检查录制是否成功开始
		const currentLogs = testPageLogs.join("\n");
		expect(currentLogs).toContain("Recording started");

		// 点击停止录制
		const stopButton = await popupPage.waitForSelector(
			"button:has-text('停止录制')",
			{ timeout: 5000 },
		);
		await stopButton.click();

		// 等待停止完成
		await testPage.waitForTimeout(2000);

		// 验证停止日志
		const stoppedLogs = testPageLogs.join("\n");
		expect(stoppedLogs).toContain("Recording stopped");

		await popupPage.close();
		await testPage.close();
	});

	test("暂停和恢复录制", async ({ context, extensionId }) => {
		// 打开测试页面
		const testPage = await context.newPage();
		const logs: string[] = [];
		testPage.on("console", (msg) => {
			logs.push(`[${msg.type()}] ${msg.text()}`);
		});

		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(3000);

		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForSelector(".recording-ui");

		// 开始录制
		await popupPage.click("button:has-text('开始录制')");
		await testPage.waitForTimeout(10000);

		// 验证录制已开始
		const startedLogs = logs.join("\n");
		expect(startedLogs).toContain("Recording started");

		// 点击暂停
		const pauseButton = await popupPage.waitForSelector(
			"button:has-text('暂停')",
			{ timeout: 5000 },
		);
		await pauseButton.click();
		await testPage.waitForTimeout(2000);

		// 验证暂停
		const pausedLogs = logs.join("\n");
		expect(pausedLogs).toContain("Recording paused");

		// 点击继续录制
		const resumeButton = await popupPage.waitForSelector(
			"button:has-text('继续')",
			{ timeout: 5000 },
		);
		await resumeButton.click();
		await testPage.waitForTimeout(2000);

		// 验证恢复
		const resumedLogs = logs.join("\n");
		expect(resumedLogs).toContain("Recording resumed");

		// 停止
		const stopButton = await popupPage.waitForSelector(
			"button:has-text('停止录制')",
			{ timeout: 5000 },
		);
		await stopButton.click();

		await popupPage.close();
		await testPage.close();
	});

	test("IndexedDB 中有 segment 数据", async ({ context, extensionId }) => {
		// 打开测试页面
		const testPage = await context.newPage();
		await testPage.goto("https://example.com");
		await testPage.waitForTimeout(3000);

		// 打开 popup 并开始录制
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForSelector(".recording-ui");
		await popupPage.click("button:has-text('开始录制')");

		// 等待录制开始
		await testPage.waitForTimeout(10000);

		// 访问其他页面收集数据
		await testPage.goto("https://example.com/about");
		await testPage.waitForTimeout(2000);

		// 停止录制
		const stopButton = await popupPage.waitForSelector(
			"button:has-text('停止录制')",
			{ timeout: 5000 },
		);
		await stopButton.click();
		await testPage.waitForTimeout(2000);

		// 检查 IndexedDB 中是否有 segment
		const segments = await testPage.evaluate(async () => {
			return new Promise<number>((resolve) => {
				const request = indexedDB.open("neo-agent-recordings", 1);
				request.onsuccess = () => {
					const db = request.result;
					if (!db.objectStoreNames.contains("segments")) {
						resolve(0);
						return;
					}
					const transaction = db.transaction("segments", "readonly");
					const store = transaction.objectStore("segments");
					const getAllRequest = store.getAll();
					getAllRequest.onsuccess = () => {
						resolve(getAllRequest.result.length);
					};
					getAllRequest.onerror = () => resolve(0);
				};
				request.onerror = () => resolve(0);
			});
		});

		console.log("Segments in IndexedDB:", segments);
		expect(segments).toBeGreaterThan(0);

		await popupPage.close();
		await testPage.close();
	});

	test("rrweb 和 recorder 都正确加载", async ({ context }) => {
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

		// 检查 IndexedDB
		const dbInfo = await testPage.evaluate(async () => {
			const databases = await indexedDB.databases();
			return databases.map((d) => d.name).filter(Boolean);
		});

		console.log("Available databases:", dbInfo);
		expect(dbInfo).toContain("neo-agent-recordings");

		await testPage.close();
	});

	test("Storage 通信正常工作", async ({ context, extensionId }) => {
		// 打开 popup
		const popupPage = await context.newPage();
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForSelector(".recording-ui");

		// 验证 storage API 可用
		const storageTest = await popupPage.evaluate(async () => {
			const hasChrome = typeof chrome !== "undefined";
			const hasStorage = hasChrome && typeof chrome.storage !== "undefined";
			return { hasChrome, hasStorage };
		});

		expect(storageTest.hasStorage).toBeTruthy();

		await popupPage.close();
	});
});
