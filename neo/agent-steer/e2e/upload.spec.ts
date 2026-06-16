/**
 * E2E: agent-steer 录制上传到 Neo 后端
 *
 * 覆盖 spec 中的关键场景:
 *   - 单 tab 单 segment 上传 (task 7.2)
 *   - 多 segments 上传,验证 sequence 自增 (task 7.3)
 *   - 跨 tab 多 origin 上传,每个 tab 独立上传一次 (task 7.4)
 *
 * 测试通过 SW 的 test-only 钩子 (test-start-upload message / __test_startUpload 全局)
 * 触发上传,避免依赖 Popup UI 的 fetchAuthState iframe bridge。
 */

import { test, expect } from "./fixtures";
import type { Page, BrowserContext } from "@playwright/test";

const BACKEND_URL = "http://localhost:8000";
const TEST_USER_PHONE = "13800138002";
const TEST_USER_PASSWORD = "abcd1234";
const WORKSPACE_CODE = "default";

// ==================== Helpers ====================

async function loginAndGetToken(): Promise<string> {
	const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			phone: TEST_USER_PHONE,
			password: TEST_USER_PASSWORD,
		}),
	});
	const json = (await res.json()) as {
		code: number;
		data: { token: string };
	};
	if (json.code !== 0) throw new Error(`login failed: ${JSON.stringify(json)}`);
	return json.data.token;
}

async function getServiceWorker(context: BrowserContext) {
	return (
		context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"))
	);
}

/** 通过 SW service worker evaluate 注入 auth token 到 chrome.storage.local。
 *  注意 WXT 的 storage.getItem 会剥离 "local:" 前缀,因此原生 chrome key 应为 "auth.userInfo"。
 */
async function seedAuth(
	context: BrowserContext,
	token: string,
	workspaceCode: string,
): Promise<void> {
	const sw = await getServiceWorker(context);
	await sw.evaluate(
		async ({ token, workspaceCode }) => {
			await new Promise<void>((resolve, reject) => {
				chrome.storage.local.set(
					{
						"auth.userInfo": {
							type: "user_info",
							version: 1,
							status: "ok",
							token,
							userId: 3,
							username: "e2e",
							workspaceCode,
							workspaceId: 9,
							acquiredAt: Date.now(),
						},
					},
					() => {
						if (chrome.runtime.lastError) {
							reject(new Error(chrome.runtime.lastError.message));
						} else {
							resolve();
						}
					},
				);
			});
		},
		{ token, workspaceCode },
	);
}

/** 在 page world 写一个 segment 到 IndexedDB (模拟 recorder.js) */
async function seedSegment(
	page: Page,
	opts: {
		uid: string;
		sessionId: string;
		sequence: number;
		startTime: number;
		endTime: number;
		events: unknown[];
		pageUrls: string[];
	},
): Promise<void> {
	await page.evaluate(
		async ({
			uid,
			sessionId,
			sequence,
			startTime,
			endTime,
			events,
			pageUrls,
		}) => {
			return new Promise<void>((resolve, reject) => {
				const req = indexedDB.open("neo-agent-recordings", 1);
				req.onupgradeneeded = (e) => {
					const db = (e.target as IDBOpenDBRequest).result;
					if (!db.objectStoreNames.contains("segments")) {
						db.createObjectStore("segments", { keyPath: "uid" });
					}
					if (!db.objectStoreNames.contains("sessions")) {
						db.createObjectStore("sessions", { keyPath: "uid" });
					}
				};
				req.onsuccess = () => {
					const db = req.result;
					const tx = db.transaction("segments", "readwrite");
					tx.objectStore("segments").put({
						uid,
						sessionId,
						sequence,
						startTime,
						endTime,
						eventCount: events.length,
						events: JSON.stringify(events),
						pageUrls,
						createdAt: startTime,
						synced: false,
					});
					tx.oncomplete = () => {
						db.close();
						resolve();
					};
					tx.onerror = () => reject(tx.error);
				};
				req.onerror = () => reject(req.error);
			});
		},
		opts,
	);
}

/** 通过 SW evaluate 调用 test-only __test_startUpload 钩子 */
async function triggerUpload(
	context: BrowserContext,
	recordingName: string,
): Promise<{ success: boolean; error?: string }> {
	const sw = await getServiceWorker(context);
	return (await sw.evaluate(
		async ({ name, workspaceCode, backendUrl }) => {
			const fn = (
				self as unknown as {
					__test_startUpload?: (
						name: string,
						workspaceCode: string,
						backendUrl?: string,
					) => Promise<{ success: boolean; error?: string }>;
				}
			).__test_startUpload;
			if (!fn) return { success: false, error: "__test_startUpload not found" };
			return await fn(name, workspaceCode, backendUrl);
		},
		{
			name: recordingName,
			workspaceCode: WORKSPACE_CODE,
			backendUrl: BACKEND_URL,
		},
	)) as { success: boolean; error?: string };
}

/** 轮询 SW 的 upload-progress 缓存,等上传完成 */
async function waitForUploadComplete(
	context: BrowserContext,
	timeoutMs = 20000,
): Promise<{
	ok: boolean;
	completed: boolean;
	recordingUid?: string;
	error?: string;
	progress: unknown[];
}> {
	const sw = await getServiceWorker(context);
	return (await sw.evaluate(async (timeoutMs) => {
		const start = Date.now();
		const getLogs = () =>
			(self as unknown as { __test_upload_logs?: unknown[] })
				.__test_upload_logs ?? [];
		while (Date.now() - start < (timeoutMs as number)) {
			const logs = getLogs();
			const last = logs[logs.length - 1] as
				| { status?: string; recordingUid?: string; error?: string }
				| undefined;
			if (last?.status === "completed") {
				return {
					ok: true,
					completed: true,
					recordingUid: last.recordingUid,
					progress: logs,
				};
			}
			if (last?.status === "failed") {
				return {
					ok: false,
					completed: false,
					error: last.error,
					progress: logs,
				};
			}
			await new Promise((r) => setTimeout(r, 300));
		}
		return {
			ok: false,
			completed: false,
			error: `timeout ${timeoutMs}ms`,
			progress: getLogs(),
		};
	}, timeoutMs)) as {
		ok: boolean;
		completed: boolean;
		recordingUid?: string;
		error?: string;
		progress: unknown[];
	};
}

async function clearUploadLogs(context: BrowserContext): Promise<void> {
	const sw = await getServiceWorker(context);
	await sw.evaluate(async () => {
		(self as unknown as { __test_upload_logs?: unknown[] }).__test_upload_logs =
			[];
	});
}

async function listRecordings(
	token: string,
): Promise<{
	items: Array<{ uid: string; name: string; segment_count: number }>;
	total: number;
}> {
	const res = await fetch(
		`${BACKEND_URL}/api/v1/workspaces/${WORKSPACE_CODE}/recordings?page_size=100`,
		{ headers: { Authorization: `Bearer ${token}` } },
	);
	const json = (await res.json()) as {
		code: number;
		data: {
			items: Array<{ uid: string; name: string; segment_count: number }>;
			total: number;
		};
	};
	if (json.code !== 0) throw new Error(`list failed: ${JSON.stringify(json)}`);
	return json.data;
}

async function getRecording(token: string, uid: string) {
	const res = await fetch(
		`${BACKEND_URL}/api/v1/workspaces/${WORKSPACE_CODE}/recordings/${uid}`,
		{ headers: { Authorization: `Bearer ${token}` } },
	);
	const json = (await res.json()) as { code: number; data: unknown };
	if (json.code !== 0)
		throw new Error(`getRecording failed: ${JSON.stringify(json)}`);
	return json.data;
}

// ==================== Tests ====================

test.describe("录制上传 e2e", () => {
	let token: string;

	test.beforeAll(async () => {
		token = await loginAndGetToken();
	});

	test("单 tab 单 segment 上传成功", async ({ context }) => {
		await seedAuth(context, token, WORKSPACE_CODE);

		const page = await context.newPage();
		await page.goto("https://example.com");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForTimeout(1500); // 等 CS 初始化

		const segmentUid = `seg-single-${Date.now()}`;
		const sessionId = `sess-single-${Date.now()}`;
		await seedSegment(page, {
			uid: segmentUid,
			sessionId,
			sequence: 1,
			startTime: Date.now(),
			endTime: Date.now() + 5000,
			events: [
				{ type: 4, data: { href: "https://example.com/", width: 1280 } },
				{ type: 5, data: { source: 1, lines: [] } },
			],
			pageUrls: ["https://example.com/"],
		});

		await clearUploadLogs(context);
		const before = await listRecordings(token);

		const trigger = await triggerUpload(context, "single-segment-test");
		expect(trigger.success).toBe(true);

		const result = await waitForUploadComplete(context);
		expect(result.ok).toBe(true);
		expect(result.completed).toBe(true);
		expect(result.recordingUid).toBeTruthy();

		const after = await listRecordings(token);
		expect(after.total).toBe(before.total + 1);

		const newRec = after.items.find((r) => r.uid === result.recordingUid);
		expect(newRec).toBeTruthy();
		expect(newRec?.name).toBe("single-segment-test");
		expect(newRec?.segment_count).toBe(1);
	});

	test("多 segments 上传,后端 sequence 自增", async ({ context }) => {
		await seedAuth(context, token, WORKSPACE_CODE);

		const page = await context.newPage();
		await page.goto("https://example.com");
		await page.waitForLoadState("domcontentloaded");
		await page.waitForTimeout(1500);

		const sessionId = `sess-multi-${Date.now()}`;
		const now = Date.now();
		// seed 3 个 segments, sequence 1/2/3
		for (let i = 0; i < 3; i++) {
			await seedSegment(page, {
				uid: `seg-multi-${Date.now()}-${i}`,
				sessionId,
				sequence: i + 1,
				startTime: now + i * 60000,
				endTime: now + (i + 1) * 60000,
				events: [
					{ type: 4, data: { href: "https://example.com/", width: 1280 } },
				],
				pageUrls: ["https://example.com/"],
			});
		}

		await clearUploadLogs(context);

		const trigger = await triggerUpload(context, "multi-segment-test");
		expect(trigger.success).toBe(true);

		const result = await waitForUploadComplete(context, 30000);
		expect(result.ok).toBe(true);
		expect(result.recordingUid).toBeTruthy();

		const detail = (await getRecording(token, result.recordingUid!)) as {
			segments: Array<{ sequence: number; size: number }>;
		};
		expect(detail.segments.length).toBe(3);
		// sequence 应该是 1/2/3 (按 add_segment 的 next_sequence 逻辑)
		expect(
			detail.segments.map((s) => s.sequence).sort((a, b) => a - b),
		).toEqual([1, 2, 3]);
	});

	test("跨 tab 多 origin 上传,每个 tab 独立创建 recording", async ({
		context,
	}) => {
		await seedAuth(context, token, WORKSPACE_CODE);

		// Tab A: https://example.com
		const pageA = await context.newPage();
		await pageA.goto("https://example.com");
		await pageA.waitForLoadState("domcontentloaded");
		await pageA.waitForTimeout(1500);

		// Tab B: https://example.org (不同 origin)
		const pageB = await context.newPage();
		await pageB.goto("https://example.org");
		await pageB.waitForLoadState("domcontentloaded");
		await pageB.waitForTimeout(1500);

		const sessionIdA = `sess-cross-a-${Date.now()}`;
		const sessionIdB = `sess-cross-b-${Date.now()}`;
		await seedSegment(pageA, {
			uid: `seg-cross-a-${Date.now()}`,
			sessionId: sessionIdA,
			sequence: 1,
			startTime: Date.now(),
			endTime: Date.now() + 5000,
			events: [{ type: 4, data: { href: "https://example.com/" } }],
			pageUrls: ["https://example.com/"],
		});
		await seedSegment(pageB, {
			uid: `seg-cross-b-${Date.now()}`,
			sessionId: sessionIdB,
			sequence: 1,
			startTime: Date.now(),
			endTime: Date.now() + 5000,
			events: [{ type: 4, data: { href: "https://example.org/" } }],
			pageUrls: ["https://example.org/"],
		});

		// 让 pageA 处于激活状态再触发上传,确保上传的是 pageA 的 segments
		await pageA.bringToFront();
		await clearUploadLogs(context);
		const beforeCount = (await listRecordings(token)).total;

		const triggerA = await triggerUpload(context, "cross-tab-A");
		expect(triggerA.success).toBe(true);

		const resultA = await waitForUploadComplete(context);
		expect(resultA.ok).toBe(true);
		expect(resultA.recordingUid).toBeTruthy();

		// 切到 pageB 再触发一次上传
		await pageB.bringToFront();
		await clearUploadLogs(context);

		const triggerB = await triggerUpload(context, "cross-tab-B");
		expect(triggerB.success).toBe(true);

		const resultB = await waitForUploadComplete(context);
		expect(resultB.ok).toBe(true);
		expect(resultB.recordingUid).toBeTruthy();

		// 两个 recording 应该是不同的 UID
		expect(resultA.recordingUid).not.toBe(resultB.recordingUid);

		// 总数应增加 2
		const afterCount = (await listRecordings(token)).total;
		expect(afterCount).toBe(beforeCount + 2);

		// 验证两个 recording 都存在
		const all = await listRecordings(token);
		const recA = all.items.find((r) => r.uid === resultA.recordingUid);
		const recB = all.items.find((r) => r.uid === resultB.recordingUid);
		expect(recA?.name).toBe("cross-tab-A");
		expect(recB?.name).toBe("cross-tab-B");
	});
});
