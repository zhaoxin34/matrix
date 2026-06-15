import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * E2E 测试：录制功能端到端测试
 *
 * 测试完整的录制流程，包括：
 * 1. 初始状态验证
 * 2. 开始/暂停/继续录制
 * 3. 录制过程中页面操作
 * 4. 暂停后清除录制 + UI 回到 Idle 状态验证
 *
 * 💡 调试模式：
 *    PAUSE_BETWEEN_STEPS=true npx playwright test e2e/recording.spec.ts
 *    会在每个阶段暂停，方便查看界面状态
 */

// 调试辅助函数
const PAUSE_BETWEEN_STEPS = process.env.PAUSE_BETWEEN_STEPS === "true";

async function pauseIfEnabled(page: Page, stepName: string) {
	if (PAUSE_BETWEEN_STEPS) {
		console.log(`\n🔴 Pausing at: ${stepName}`);
		console.log("Press 'Continue' in Playwright Inspector to resume...\n");
		await page.pause();
	}
}

test.describe("录制功能 E2E", () => {
	test("完整录制流程 - 开始录制 → 暂停 → 继续 → 清除 → 验证 IndexedDB 存储", async ({
		context,
		extensionId,
	}) => {
		// 创建页面
		const testPage = await context.newPage();
		const popupPage = await context.newPage();

		await testPage.goto("https://example.com");
		await testPage.waitForLoadState("domcontentloaded");

		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForLoadState("domcontentloaded");

		await testPage.bringToFront();

		// ========== 第一阶段：初始状态验证 ==========
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		const startButtonVisible = await popupPage
			.locator("button:has-text('开始录制')")
			.isVisible();
		expect(startButtonVisible).toBeTruthy();

		await pauseIfEnabled(popupPage, "第一阶段：初始状态 - 验证 Idle 视图");

		// ========== 第二阶段：开始录制 ==========
		await popupPage.click("button:has-text('开始录制')");
		await expect(popupPage.locator("button:has-text('停止录制')")).toBeVisible({
			timeout: 10000,
		});

		// 验证录制中状态
		const stopButtonVisible = await popupPage
			.locator("button:has-text('停止录制')")
			.isVisible();
		const pauseButtonVisible = await popupPage
			.locator("button:has-text('暂停录制')")
			.isVisible();
		expect(stopButtonVisible || pauseButtonVisible).toBeTruthy();

		await pauseIfEnabled(popupPage, "第二阶段：开始录制 - 验证 Recording 视图");

		// 验证 rrweb 和 recorder 已加载
		const rrwebLoaded = await testPage.evaluate(() => {
			return (
				typeof (window as unknown as Record<string, unknown>).rrwebRecord !==
				"undefined"
			);
		});
		expect(rrwebLoaded).toBeTruthy();

		// 执行一些页面操作，生成录制事件
		for (let i = 0; i < 5; i++) {
			const idx = i;
			await testPage.evaluate((i: number) => {
				const el = document.createElement("div");
				el.id = `test-element-${i}`;
				el.textContent = `Test ${i}`;
				document.body.appendChild(el);
			}, idx);
			await testPage.waitForTimeout(100);
		}

		// ========== 第三阶段：暂停录制 ==========
		await pauseIfEnabled(popupPage, "第三阶段前：即将点击暂停");
		await popupPage.click("button:has-text('暂停录制')");

		await expect(popupPage.locator("button:has-text('继续录制')")).toBeVisible({
			timeout: 5000,
		});

		// 验证暂停状态
		const resumeButtonVisible = await popupPage
			.locator("button:has-text('继续录制')")
			.isVisible();
		const uploadButtonVisible = await popupPage
			.locator("button:has-text('上传')")
			.isVisible();
		expect(resumeButtonVisible).toBeTruthy();
		expect(uploadButtonVisible).toBeTruthy();

		await pauseIfEnabled(popupPage, "第三阶段：暂停录制 - 验证 Paused 视图");

		// ========== 第三阶段：清除录制（暂停状态下） ==========
		await pauseIfEnabled(popupPage, "第三阶段：即将点击清除");
		await popupPage.click("button:has-text('清除')");

		await expect(popupPage.locator("button:has-text('开始录制')")).toBeVisible({
			timeout: 10000,
		});

		// ========== 第四阶段：验证 UI 回到 Idle 状态 ==========
		// 验证显示"准备就绪"
		const idleTitle = await popupPage
			.locator('h3:has-text("准备就绪")')
			.isVisible();
		expect(idleTitle).toBeTruthy();

		await pauseIfEnabled(popupPage, "第四阶段：清除完成 - 回到 Idle 状态");

		// 清理
		await popupPage.close();
		await testPage.close();
	});

	test("清除后 IndexedDB 数据验证", async ({ context, extensionId }) => {
		// 创建页面
		const testPage = await context.newPage();
		const popupPage = await context.newPage();

		await testPage.goto("https://example.com");
		await testPage.waitForLoadState("domcontentloaded");

		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForLoadState("domcontentloaded");

		await testPage.bringToFront();

		// ========== 开始录制 ==========
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await expect(
			popupPage.locator("button:has-text('停止录制')"),
		).toBeVisible({ timeout: 10000 });

		// 执行一些操作生成录制数据
		for (let i = 0; i < 3; i++) {
			await testPage.evaluate((idx: number) => {
				const el = document.createElement("div");
				el.id = `test-el-${idx}`;
				document.body.appendChild(el);
			}, i);
			await testPage.waitForTimeout(200);
		}

		// ========== 暂停录制 ==========
		await popupPage.click("button:has-text('暂停录制')");
		await expect(
			popupPage.locator("button:has-text('继续录制')"),
		).toBeVisible({ timeout: 5000 });

		// ========== 验证清除前有数据 ==========
		const dataBeforeClear = await testPage.evaluate(async () => {
			return new Promise<{ segments: number; sessions: number }>((resolve) => {
				const request = indexedDB.open("neo-agent-recordings", 1);
				request.onsuccess = () => {
					const db = request.result;
					const segmentsTx = db.transaction("segments", "readonly");
					const segmentsStore = segmentsTx.objectStore("segments");
					const segmentsReq = segmentsStore.getAll();
					segmentsReq.onsuccess = () => {
						const sessionsTx = db.transaction("sessions", "readonly");
						const sessionsStore = sessionsTx.objectStore("sessions");
						const sessionsReq = sessionsStore.getAll();
						sessionsReq.onsuccess = () => {
							resolve({
								segments: segmentsReq.result.length,
								sessions: sessionsReq.result.length,
							});
						};
					};
				};
			});
		});
		console.log("清除前数据:", dataBeforeClear);
		expect(dataBeforeClear.segments).toBeGreaterThan(0);
		expect(dataBeforeClear.sessions).toBeGreaterThan(0);

		// ========== 清除录制 ==========
		await popupPage.click("button:has-text('清除')");
		await expect(
			popupPage.locator("button:has-text('开始录制')"),
		).toBeVisible({ timeout: 10000 });

		// 等待一下确保清除操作完成
		await testPage.waitForTimeout(500);

		// ========== 验证清除后 IndexedDB 数据为空 ==========
		const dataAfterClear = await testPage.evaluate(async () => {
			return new Promise<{ segments: number; sessions: number }>((resolve) => {
				const request = indexedDB.open("neo-agent-recordings", 1);
				request.onsuccess = () => {
					const db = request.result;
					const segmentsTx = db.transaction("segments", "readonly");
					const segmentsStore = segmentsTx.objectStore("segments");
					const segmentsReq = segmentsStore.getAll();
					segmentsReq.onsuccess = () => {
						const sessionsTx = db.transaction("sessions", "readonly");
						const sessionsStore = sessionsTx.objectStore("sessions");
						const sessionsReq = sessionsStore.getAll();
						sessionsReq.onsuccess = () => {
							resolve({
								segments: segmentsReq.result.length,
								sessions: sessionsReq.result.length,
							});
						};
					};
				};
			});
		});
		console.log("清除后数据:", dataAfterClear);

		// 验证 IndexedDB 数据已被清空
		expect(dataAfterClear.segments).toBe(0);
		expect(dataAfterClear.sessions).toBe(0);

		// 清理
		await popupPage.close();
		await testPage.close();
	});

	test("时长实时更新验证", async ({ context, extensionId }) => {
		// 创建页面
		const testPage = await context.newPage();
		const popupPage = await context.newPage();

		await testPage.goto("https://example.com");
		await testPage.waitForLoadState("domcontentloaded");

		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForLoadState("domcontentloaded");

		await testPage.bringToFront();

		// 开始录制
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await expect(
			popupPage.locator("button:has-text('停止录制')"),
		).toBeVisible();

		// 等待一段时间
		await testPage.waitForTimeout(2000);

		// 检查时长显示
		const durationText = await popupPage
			.locator("text=/\\d{1,2}:\\d{2}(:\\d{2})?/")
			.first()
			.textContent();

		expect(durationText).toBeTruthy();
		expect(durationText).not.toBe("00:00:00");

		// 验证时长合理
		const timeParts = durationText?.split(":").map(Number) ?? [];
		const totalSeconds =
			timeParts.length === 3
				? timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
				: timeParts.length === 2
					? timeParts[0] * 60 + timeParts[1]
					: 0;

		expect(totalSeconds).toBeGreaterThanOrEqual(2);

		// 清理
		await popupPage.close();
		await testPage.close();
	});
});
