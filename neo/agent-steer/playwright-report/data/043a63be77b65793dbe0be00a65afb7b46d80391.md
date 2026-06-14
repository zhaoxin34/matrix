# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recording.spec.ts >> 录制功能 E2E >> IndexedDB 中有 segment 数据
- Location: e2e/recording.spec.ts:120:2

# Error details

```
TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('button:has-text(\'停止录制\')') to be visible

```

# Test source

```ts
  40  | 		const currentLogs = testPageLogs.join("\n");
  41  | 		expect(currentLogs).toContain("Recording started");
  42  | 
  43  | 		// 点击停止录制
  44  | 		const stopButton = await popupPage.waitForSelector(
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
> 140 | 		const stopButton = await popupPage.waitForSelector(
      |                                      ^ TimeoutError: page.waitForSelector: Timeout 5000ms exceeded.
  141 | 			"button:has-text('停止录制')",
  142 | 			{ timeout: 5000 },
  143 | 		);
  144 | 		await stopButton.click();
  145 | 		await testPage.waitForTimeout(2000);
  146 | 
  147 | 		// 检查 IndexedDB 中是否有 segment
  148 | 		const segments = await testPage.evaluate(async () => {
  149 | 			return new Promise<number>((resolve) => {
  150 | 				const request = indexedDB.open("neo-agent-recordings", 1);
  151 | 				request.onsuccess = () => {
  152 | 					const db = request.result;
  153 | 					if (!db.objectStoreNames.contains("segments")) {
  154 | 						resolve(0);
  155 | 						return;
  156 | 					}
  157 | 					const transaction = db.transaction("segments", "readonly");
  158 | 					const store = transaction.objectStore("segments");
  159 | 					const getAllRequest = store.getAll();
  160 | 					getAllRequest.onsuccess = () => {
  161 | 						resolve(getAllRequest.result.length);
  162 | 					};
  163 | 					getAllRequest.onerror = () => resolve(0);
  164 | 				};
  165 | 				request.onerror = () => resolve(0);
  166 | 			});
  167 | 		});
  168 | 
  169 | 		console.log("Segments in IndexedDB:", segments);
  170 | 		expect(segments).toBeGreaterThan(0);
  171 | 
  172 | 		await popupPage.close();
  173 | 		await testPage.close();
  174 | 	});
  175 | 
  176 | 	test("rrweb 和 recorder 都正确加载", async ({ context }) => {
  177 | 		// 打开测试页面
  178 | 		const testPage = await context.newPage();
  179 | 		await testPage.goto("https://example.com");
  180 | 		await testPage.waitForTimeout(3000);
  181 | 
  182 | 		// 检查 rrweb 是否已加载
  183 | 		const hasRRWeb = await testPage.evaluate(() => {
  184 | 			return typeof (window as unknown as Record<string, unknown>).rrwebRecord !== "undefined";
  185 | 		});
  186 | 
  187 | 		expect(hasRRWeb).toBeTruthy();
  188 | 
  189 | 		// 检查 recorder 是否已初始化
  190 | 		const hasRecorder = await testPage.evaluate(() => {
  191 | 			return typeof (window as unknown as Record<string, unknown>).__recorderInitialized !== "undefined";
  192 | 		});
  193 | 
  194 | 		expect(hasRecorder).toBeTruthy();
  195 | 
  196 | 		// 检查 IndexedDB
  197 | 		const dbInfo = await testPage.evaluate(async () => {
  198 | 			const databases = await indexedDB.databases();
  199 | 			return databases.map((d) => d.name).filter(Boolean);
  200 | 		});
  201 | 
  202 | 		console.log("Available databases:", dbInfo);
  203 | 		expect(dbInfo).toContain("neo-agent-recordings");
  204 | 
  205 | 		await testPage.close();
  206 | 	});
  207 | 
  208 | 	test("Storage 通信正常工作", async ({ context, extensionId }) => {
  209 | 		// 打开 popup
  210 | 		const popupPage = await context.newPage();
  211 | 		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  212 | 		await popupPage.waitForSelector(".recording-ui");
  213 | 
  214 | 		// 验证 storage API 可用
  215 | 		const storageTest = await popupPage.evaluate(async () => {
  216 | 			const hasChrome = typeof chrome !== "undefined";
  217 | 			const hasStorage = hasChrome && typeof chrome.storage !== "undefined";
  218 | 			return { hasChrome, hasStorage };
  219 | 		});
  220 | 
  221 | 		expect(storageTest.hasStorage).toBeTruthy();
  222 | 
  223 | 		await popupPage.close();
  224 | 	});
  225 | });
  226 | 
```