/**
 * Recorder Module Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock chrome API
const mockChrome = {
	runtime: {
		sendMessage: vi.fn(),
	},
};
vi.stubGlobal("chrome", mockChrome);

// Create mock functions
const mockStopFn = vi.fn();

// Mock rrweb - record() returns a stop function
vi.mock("rrweb", () => ({
	record: vi.fn(() => mockStopFn),
}));

// Import after mock
import { recorder } from "../../src/content/recorder";

describe("Recorder Module", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockStopFn.mockClear();
		// Reset recorder state
		if (recorder.isRecording()) {
			recorder.stop();
		}
	});

	afterEach(() => {
		if (recorder.isRecording()) {
			recorder.stop();
		}
	});

	describe("startRecording", () => {
		it("should start recording and generate sessionId", () => {
			recorder.start();

			expect(recorder.isRecording()).toBe(true);
			expect(recorder.isPaused()).toBe(false);
			expect(recorder.getSessionId()).toBeDefined();
			expect(recorder.getSessionId()).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);
		});

		it("should not start recording twice", () => {
			recorder.start();
			const firstSessionId = recorder.getSessionId();

			// Try to start again
			recorder.start();

			// Should keep the same session
			expect(recorder.getSessionId()).toBe(firstSessionId);
		});
	});

	describe("stopRecording", () => {
		it("should stop recording and return events", () => {
			recorder.start();

			const result = recorder.stop();

			expect(recorder.isRecording()).toBe(false);
			expect(result).not.toBeNull();
			expect(result!).toHaveProperty("sessionId");
			expect(result!).toHaveProperty("events");
			expect(result!).toHaveProperty("startTime");
			expect(result!).toHaveProperty("endTime");
			expect(Array.isArray(result!.events)).toBe(true);
		});

		it("should return empty events array if nothing recorded", () => {
			recorder.start();

			const result = recorder.stop();

			expect(result).not.toBeNull();
			expect(result!.events).toEqual([]);
		});

		it("should return null when not recording", () => {
			const result = recorder.stop();

			expect(result).toBeNull();
		});

		it("should call rrweb stop function", () => {
			recorder.start();
			recorder.stop();

			expect(mockStopFn).toHaveBeenCalled();
		});
	});

	describe("pauseRecording", () => {
		it("should pause recording when recording is active", () => {
			recorder.start();
			recorder.pause();

			expect(recorder.isRecording()).toBe(true);
			expect(recorder.isPaused()).toBe(true);
		});

		it("should not pause when not recording", () => {
			recorder.pause();

			expect(recorder.isRecording()).toBe(false);
			expect(recorder.isPaused()).toBe(false);
		});

		it("should not pause when already paused", () => {
			recorder.start();
			recorder.pause();
			const sessionId = recorder.getSessionId();

			recorder.pause(); // Try to pause again

			expect(recorder.getSessionId()).toBe(sessionId);
		});
	});

	describe("resumeRecording", () => {
		it("should resume paused recording", () => {
			recorder.start();
			recorder.pause();

			recorder.resume();

			expect(recorder.isRecording()).toBe(true);
			expect(recorder.isPaused()).toBe(false);
		});

		it("should not resume when not recording", () => {
			recorder.resume();

			expect(recorder.isRecording()).toBe(false);
		});

		it("should not resume when not paused", () => {
			recorder.start();

			recorder.resume();

			expect(recorder.isPaused()).toBe(false);
		});
	});

	describe("pause and resume together", () => {
		it("should handle pause -> resume -> pause cycle", () => {
			recorder.start();
			expect(recorder.isPaused()).toBe(false);

			recorder.pause();
			expect(recorder.isPaused()).toBe(true);

			recorder.resume();
			expect(recorder.isPaused()).toBe(false);

			recorder.pause();
			expect(recorder.isPaused()).toBe(true);

			recorder.resume();
			expect(recorder.isPaused()).toBe(false);
		});

		it("should keep same sessionId through pause/resume cycle", () => {
			recorder.start();
			const sessionId = recorder.getSessionId();

			recorder.pause();
			recorder.resume();
			recorder.pause();
			recorder.resume();

			expect(recorder.getSessionId()).toBe(sessionId);
		});
	});

	describe("onRecordingComplete callback", () => {
		it("should call callback when recording stops", () => {
			const callback = vi.fn();
			recorder.onRecordingComplete(callback);

			recorder.start();
			recorder.stop();

			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("should pass recording data to callback", () => {
			const callback = vi.fn();
			recorder.onRecordingComplete(callback);

			recorder.start();
			recorder.stop();

			expect(callback).toHaveBeenCalledTimes(1);
			expect(callback).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: expect.any(String),
					events: expect.any(Array),
					startTime: expect.any(Number),
					endTime: expect.any(Number),
				}),
			);
		});

		it("should support multiple callbacks", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			recorder.onRecordingComplete(callback1);
			recorder.onRecordingComplete(callback2);

			recorder.start();
			recorder.stop();

			expect(callback1).toHaveBeenCalledTimes(1);
			expect(callback2).toHaveBeenCalledTimes(1);
		});
	});

	describe("state management", () => {
		it("should track recording state correctly", () => {
			expect(recorder.isRecording()).toBe(false);

			recorder.start();
			expect(recorder.isRecording()).toBe(true);

			recorder.pause();
			expect(recorder.isRecording()).toBe(true);

			recorder.resume();
			expect(recorder.isRecording()).toBe(true);

			recorder.stop();
			expect(recorder.isRecording()).toBe(false);
		});

		it("should track paused state correctly", () => {
			recorder.start();
			expect(recorder.isPaused()).toBe(false);

			recorder.pause();
			expect(recorder.isPaused()).toBe(true);

			recorder.resume();
			expect(recorder.isPaused()).toBe(false);
		});
	});

	describe("sessionId", () => {
		it("should return null when not recording", () => {
			expect(recorder.getSessionId()).toBeNull();
		});

		it("should return valid UUID format", () => {
			recorder.start();
			const sessionId = recorder.getSessionId();
			recorder.stop();

			expect(sessionId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);
		});

		it("should persist same sessionId until stop", () => {
			recorder.start();
			const sessionId1 = recorder.getSessionId();

			recorder.pause();
			const sessionId2 = recorder.getSessionId();

			recorder.resume();
			const sessionId3 = recorder.getSessionId();

			recorder.stop();

			expect(sessionId1).toBe(sessionId2);
			expect(sessionId2).toBe(sessionId3);
		});
	});
});
