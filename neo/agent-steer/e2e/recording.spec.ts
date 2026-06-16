import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * E2E 测试：Recording v2 UI 流程
 *
 * 覆盖 v2 状态机：
 *   - idle → recording（开始）
 *   - recording → paused（暂停）
 *   - paused → recording（恢复）
 *   - recording → idle 或 pending（停止）
 *
 * v2 流程下没有"上传/清除/命名" UI，本测试断言这些元素**不存在**。
 *
 * 调试：PAUSE_BETWEEN_STEPS=true npx playwright test e2e/recording.spec.ts
 */

const PAUSE_BETWEEN_STEPS = process.env.PAUSE_BETWEEN_STEPS === "true";

async function pauseIfEnabled(page: Page, stepName: string) {
	if (PAUSE_BETWEEN_STEPS) {
		console.log(`\n🔴 ${stepName}`);
		await page.pause();
	}
}

test.describe("Recording v2 UI 流程", () => {
	test("Idle 视图初始状态", async ({ page, extensionId }) => {
		await page.goto(`chrome-extension://${extensionId}/popup.html`);
		await page.waitForLoadState("domcontentloaded");

		// Idle 视图：准备就绪 + 开始录制
		await expect(
			page.locator("h3:has-text('准备就绪')"),
		).toBeVisible({ timeout: 10000 });
		await expect(page.locator("button:has-text('开始录制')")).toBeVisible();

		// 关键断言：v2 不应有 v1 的视图元素
		await expect(page.locator("text=录制中")).toHaveCount(0);
		await expect(page.locator("text=已暂停")).toHaveCount(0);
		await expect(page.locator("text=待上传")).toHaveCount(0);
		await expect(page.locator("button:has-text('上传')")).toHaveCount(0);
		await expect(page.locator("button:has-text('清除')")).toHaveCount(0);
		await expect(page.locator("button:has-text('暂停录制')")).toHaveCount(0);
		await expect(page.locator("button:has-text('继续录制')")).toHaveCount(0);
		await expect(page.locator("button:has-text('停止录制')")).toHaveCount(0);

		await pauseIfEnabled(page, "Idle 视图");
	});

	test("开始录制：Idle → Recording", async ({ context, extensionId }) => {
		const testPage = await context.newPage();
		const popupPage = await context.newPage();

		await testPage.goto("https://example.com");
		await testPage.waitForLoadState("domcontentloaded");
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForLoadState("domcontentloaded");
		await testPage.bringToFront();

		// 初始 Idle
		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});

		// 点击开始
		await popupPage.click("button:has-text('开始录制')");

		// Recording 视图：录制中 + 暂停/停止
		await expect(popupPage.locator("text=录制中")).toBeVisible({ timeout: 10000 });
		await expect(popupPage.locator("button:has-text('暂停录制')")).toBeVisible();
		await expect(popupPage.locator("button:has-text('停止录制')")).toBeVisible();
		await expect(popupPage.locator("text=片段:")).toBeVisible();

		// 关键断言：v2 不应有 v1 的"上传/清除"按钮
		await expect(popupPage.locator("button:has-text('上传')")).toHaveCount(0);
		await expect(popupPage.locator("button:has-text('清除')")).toHaveCount(0);

		// rrweb 已加载到 active tab
		const rrwebLoaded = await testPage.evaluate(() => {
			return (
				typeof (window as unknown as Record<string, unknown>).rrwebRecord !==
				"undefined"
			);
		});
		expect(rrwebLoaded).toBeTruthy();

		await pauseIfEnabled(popupPage, "Recording 视图");

		await popupPage.close();
		await testPage.close();
	});

	test("暂停/恢复：Recording ↔ Paused", async ({ context, extensionId }) => {
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
		await expect(popupPage.locator("text=录制中")).toBeVisible({ timeout: 10000 });

		// 暂停
		await popupPage.click("button:has-text('暂停录制')");

		// Paused 视图（RecordingView 内部态）：已暂停 + 继续/停止
		await expect(popupPage.locator("text=已暂停")).toBeVisible({ timeout: 5000 });
		await expect(popupPage.locator("button:has-text('继续录制')")).toBeVisible();
		await expect(popupPage.locator("button:has-text('停止录制')")).toBeVisible();

		// 关键断言：v2 paused 不应有"上传/清除"
		await expect(popupPage.locator("button:has-text('上传')")).toHaveCount(0);
		await expect(popupPage.locator("button:has-text('清除')")).toHaveCount(0);

		await pauseIfEnabled(popupPage, "Paused 视图");

		// 恢复
		await popupPage.click("button:has-text('继续录制')");
		await expect(popupPage.locator("text=录制中")).toBeVisible({ timeout: 5000 });
		await expect(popupPage.locator("button:has-text('暂停录制')")).toBeVisible();

		// 多轮暂停/恢复
		for (let i = 0; i < 2; i++) {
			await popupPage.click("button:has-text('暂停录制')");
			await expect(popupPage.locator("text=已暂停")).toBeVisible({ timeout: 5000 });

			await popupPage.click("button:has-text('继续录制')");
			await expect(popupPage.locator("text=录制中")).toBeVisible({ timeout: 5000 });
		}

		await popupPage.close();
		await testPage.close();
	});

	test("时长实时更新 + 暂停时停止", async ({ context, extensionId }) => {
		const testPage = await context.newPage();
		const popupPage = await context.newPage();

		await testPage.goto("https://example.com");
		await testPage.waitForLoadState("domcontentloaded");
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForLoadState("domcontentloaded");
		await testPage.bringToFront();

		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await expect(popupPage.locator("button:has-text('停止录制')")).toBeVisible({
			timeout: 10000,
		});

		// 时长元素存在
		const durationLocator = popupPage
			.locator("text=/\\d+:\\d{2}(:\\d{2})?/")
			.first();
		await expect(durationLocator).toBeVisible();

		// 等 2.5s 后，时长应变化
		const initial = await durationLocator.textContent();
		await testPage.waitForTimeout(2500);
		const after = await durationLocator.textContent();
		expect(after).not.toBe(initial);
		expect(after).not.toBe("0:00");

		// 暂停后时长停止更新
		await popupPage.click("button:has-text('暂停录制')");
		await expect(popupPage.locator("text=已暂停")).toBeVisible({ timeout: 5000 });
		const pausedAt = await durationLocator.textContent();
		await testPage.waitForTimeout(2000);
		const pausedAfter = await durationLocator.textContent();
		expect(pausedAfter).toBe(pausedAt);

		await popupPage.close();
		await testPage.close();
	});

	test("停止：Recording → Idle / Pending", async ({ context, extensionId }) => {
		const testPage = await context.newPage();
		const popupPage = await context.newPage();

		await testPage.goto("https://example.com");
		await testPage.waitForLoadState("domcontentloaded");
		await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
		await popupPage.waitForLoadState("domcontentloaded");
		await testPage.bringToFront();

		await popupPage.waitForSelector("button:has-text('开始录制')", {
			timeout: 10000,
		});
		await popupPage.click("button:has-text('开始录制')");
		await expect(popupPage.locator("button:has-text('停止录制')")).toBeVisible({
			timeout: 10000,
		});

		// 停止
		await popupPage.click("button:has-text('停止录制')");

		// v2 设计：停止后回到 idle（自动 complete）。
		// v2 Stub 阶段：调 v1 stopRecording，v1 停在 pending。
		// 至少 popup 不卡住、且不应是"录制中"。
		await popupPage.waitForTimeout(2000);

		const isIdle = await popupPage
			.locator("button:has-text('开始录制')")
			.isVisible()
			.catch(() => false);
		const isPending = await popupPage
			.locator("text=待上传")
			.isVisible()
			.catch(() => false);
		const isStillRecording = await popupPage
			.locator("text=录制中")
			.isVisible()
			.catch(() => false);

		expect(isStillRecording).toBeFalsy();
		expect(isIdle || isPending).toBeTruthy();

		await pauseIfEnabled(
			popupPage,
			`停止后状态：${isIdle ? "Idle" : "Pending"}（${
				isIdle ? "v2 设计" : "v2 Stub 阶段"
			}）`,
		);

		await popupPage.close();
		await testPage.close();
	});
});
