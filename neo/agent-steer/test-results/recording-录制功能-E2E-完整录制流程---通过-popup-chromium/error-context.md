# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recording.spec.ts >> 录制功能 E2E >> 完整录制流程 - 通过 popup
- Location: e2e/recording.spec.ts:13:2

# Error details

```
TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('button:has-text(\'停止录制\')') to be visible

```

# Test source

```ts
  1   | import { test, expect } from "./fixtures";
  2   | 
  3   | /**
  4   |  * E2E 测试：录制功能
  5   |  * 
  6   |  * 测试录制流程：
  7   |  * 1. 打开 popup 并开始录制
  8   |  * 2. 验证录制状态
  9   |  * 3. 停止录制
  10  |  * 4. 验证 segments 写入 IndexedDB
  11  |  */
  12  | test.describe("录制功能 E2E", () => {
  13  | 	test("完整录制流程 - 通过 popup", async ({ context, extensionId }) => {
  14  | 		// 打开测试页面
  15  | 		const testPage = await context.newPage();
  16  | 
  17  | 		// 监听测试页面的控制台日志
  18  | 		const testPageLogs: string[] = [];
  19  | 		testPage.on("console", (msg) => {
  20  | 			testPageLogs.push(`[${msg.type()}] ${msg.text()}`);
  21  | 		});
  22  | 
  23  | 		await testPage.goto("https://example.com");
  24  | 
  25  | 		// 等待 content script 和 recorder 初始化
  26  | 		await testPage.waitForTimeout(3000);
  27  | 
  28  | 		// 打开 popup
  29  | 		const popupPage = await context.newPage();
  30  | 		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  31  | 		await popupPage.waitForSelector(".recording-ui");
  32  | 
  33  | 		// 点击开始录制
  34  | 		await popupPage.click("button:has-text('开始录制')");
  35  | 
  36  | 		// 等待 10 秒让录制开始
  37  | 		await testPage.waitForTimeout(10000);
  38  | 
  39  | 		// 检查录制是否成功开始
  40  | 		const currentLogs = testPageLogs.join("\n");
  41  | 		expect(currentLogs).toContain("Recording started");
  42  | 
  43  | 		// 点击停止录制
> 44  | 		const stopButton = await popupPage.waitForSelector(
      |                                      ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
  45  | 			"button:has-text('停止录制')",
  46  | 			{ timeout: 5000 },
  47  | 		);
  48  | 		await stopButton.click();
  49  | 
  50  | 		// 等待停止完成
  51  | 		await testPage.waitForTimeout(2000);
  52  | 
  53  | 		// 验证停止日志
  54  | 		const stoppedLogs = testPageLogs.join("\n");
  55  | 		expect(stoppedLogs).toContain("Recording stopped");
  56  | 
  57  | 		await popupPage.close();
  58  | 		await testPage.close();
  59  | 	});
  60  | 
  61  | 	test("暂停和恢复录制", async ({ context, extensionId }) => {
  62  | 		// 打开测试页面
  63  | 		const testPage = await context.newPage();
  64  | 		const logs: string[] = [];
  65  | 		testPage.on("console", (msg) => {
  66  | 			logs.push(`[${msg.type()}] ${msg.text()}`);
  67  | 		});
  68  | 
  69  | 		await testPage.goto("https://example.com");
  70  | 		await testPage.waitForTimeout(3000);
  71  | 
  72  | 		// 打开 popup
  73  | 		const popupPage = await context.newPage();
  74  | 		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  75  | 		await popupPage.waitForSelector(".recording-ui");
  76  | 
  77  | 		// 开始录制
  78  | 		await popupPage.click("button:has-text('开始录制')");
  79  | 		await testPage.waitForTimeout(10000);
  80  | 
  81  | 		// 验证录制已开始
  82  | 		const startedLogs = logs.join("\n");
  83  | 		expect(startedLogs).toContain("Recording started");
  84  | 
  85  | 		// 点击暂停
  86  | 		const pauseButton = await popupPage.waitForSelector(
  87  | 			"button:has-text('暂停')",
  88  | 			{ timeout: 5000 },
  89  | 		);
  90  | 		await pauseButton.click();
  91  | 		await testPage.waitForTimeout(2000);
  92  | 
  93  | 		// 验证暂停
  94  | 		const pausedLogs = logs.join("\n");
  95  | 		expect(pausedLogs).toContain("Recording paused");
  96  | 
  97  | 		// 点击继续录制
  98  | 		const resumeButton = await popupPage.waitForSelector(
  99  | 			"button:has-text('继续')",
  100 | 			{ timeout: 5000 },
  101 | 		);
  102 | 		await resumeButton.click();
  103 | 		await testPage.waitForTimeout(2000);
  104 | 
  105 | 		// 验证恢复
  106 | 		const resumedLogs = logs.join("\n");
  107 | 		expect(resumedLogs).toContain("Recording resumed");
  108 | 
  109 | 		// 停止
  110 | 		const stopButton = await popupPage.waitForSelector(
  111 | 			"button:has-text('停止录制')",
  112 | 			{ timeout: 5000 },
  113 | 		);
  114 | 		await stopButton.click();
  115 | 
  116 | 		await popupPage.close();
  117 | 		await testPage.close();
  118 | 	});
  119 | 
  120 | 	test("IndexedDB 中有 segment 数据", async ({ context, extensionId }) => {
  121 | 		// 打开测试页面
  122 | 		const testPage = await context.newPage();
  123 | 		await testPage.goto("https://example.com");
  124 | 		await testPage.waitForTimeout(3000);
  125 | 
  126 | 		// 打开 popup 并开始录制
  127 | 		const popupPage = await context.newPage();
  128 | 		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  129 | 		await popupPage.waitForSelector(".recording-ui");
  130 | 		await popupPage.click("button:has-text('开始录制')");
  131 | 
  132 | 		// 等待录制开始
  133 | 		await testPage.waitForTimeout(10000);
  134 | 
  135 | 		// 访问其他页面收集数据
  136 | 		await testPage.goto("https://example.com/about");
  137 | 		await testPage.waitForTimeout(2000);
  138 | 
  139 | 		// 停止录制
  140 | 		const stopButton = await popupPage.waitForSelector(
  141 | 			"button:has-text('停止录制')",
  142 | 			{ timeout: 5000 },
  143 | 		);
  144 | 		await stopButton.click();
```