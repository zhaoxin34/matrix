# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recording.spec.ts >> 录制功能 E2E >> IndexedDB 中有 segment 数据
- Location: e2e/recording.spec.ts:120:2

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Test source

```ts
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
> 170 | 		expect(segments).toBeGreaterThan(0);
      |                    ^ Error: expect(received).toBeGreaterThan(expected)
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
  184 | 			return (
  185 | 				typeof (window as unknown as Record<string, unknown>).rrwebRecord !==
  186 | 				"undefined"
  187 | 			);
  188 | 		});
  189 | 
  190 | 		expect(hasRRWeb).toBeTruthy();
  191 | 
  192 | 		// 检查 recorder 是否已初始化
  193 | 		const hasRecorder = await testPage.evaluate(() => {
  194 | 			return (
  195 | 				typeof (window as unknown as Record<string, unknown>)
  196 | 					.__recorderInitialized !== "undefined"
  197 | 			);
  198 | 		});
  199 | 
  200 | 		expect(hasRecorder).toBeTruthy();
  201 | 
  202 | 		// 检查 IndexedDB
  203 | 		const dbInfo = await testPage.evaluate(async () => {
  204 | 			const databases = await indexedDB.databases();
  205 | 			return databases.map((d) => d.name).filter(Boolean);
  206 | 		});
  207 | 
  208 | 		console.log("Available databases:", dbInfo);
  209 | 		expect(dbInfo).toContain("neo-agent-recordings");
  210 | 
  211 | 		await testPage.close();
  212 | 	});
  213 | 
  214 | 	test("Storage 通信正常工作", async ({ context, extensionId }) => {
  215 | 		// 打开 popup
  216 | 		const popupPage = await context.newPage();
  217 | 		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  218 | 		await popupPage.waitForSelector(".recording-ui");
  219 | 
  220 | 		// 验证 storage API 可用
  221 | 		const storageTest = await popupPage.evaluate(async () => {
  222 | 			const hasChrome = typeof chrome !== "undefined";
  223 | 			const hasStorage = hasChrome && typeof chrome.storage !== "undefined";
  224 | 			return { hasChrome, hasStorage };
  225 | 		});
  226 | 
  227 | 		expect(storageTest.hasStorage).toBeTruthy();
  228 | 
  229 | 		await popupPage.close();
  230 | 	});
  231 | });
  232 | 
```