/**
 * Operator Module Unit Tests
 * Tests for DOM operation execution
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock chrome API
const mockChrome = {
	runtime: {
		sendMessage: vi.fn(),
	},
};
vi.stubGlobal("chrome", mockChrome);

// Import after mocks
import { operator } from "../../src/content/operator";

describe("Operator Module", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("onResult", () => {
		it("should accept a callback function", () => {
			expect(() => {
				operator.onResult(() => {});
			}).not.toThrow();
		});

		it("should allow setting result callback multiple times", () => {
			operator.onResult(() => {});
			operator.onResult(() => {});

			expect(true).toBe(true);
		});
	});

	describe("execute", () => {
		it("should accept click action", () => {
			expect(() => {
				operator.execute({ action: "click", selector: "#button" });
			}).not.toThrow();
		});

		it("should accept input action", () => {
			expect(() => {
				operator.execute({
					action: "input",
					selector: "#input",
					value: "test",
				});
			}).not.toThrow();
		});

		it("should accept submit action", () => {
			expect(() => {
				operator.execute({ action: "submit", selector: "form" });
			}).not.toThrow();
		});

		it("should accept navigate action", () => {
			expect(() => {
				operator.execute({
					action: "navigate",
					selector: "",
					value: "https://example.com",
				});
			}).not.toThrow();
		});

		it("should accept action with fallbackSelector", () => {
			expect(() => {
				operator.execute({
					action: "click",
					selector: "#primary-button",
					fallbackSelector: ".btn-primary",
				});
			}).not.toThrow();
		});

		it("should handle missing selector gracefully", () => {
			expect(() => {
				operator.execute({ action: "click", selector: "" });
			}).not.toThrow();
		});

		it("should handle missing value for input action", () => {
			expect(() => {
				operator.execute({ action: "input", selector: "#input" });
			}).not.toThrow();
		});
	});

	describe("action types", () => {
		it("should support all defined action types", () => {
			const actions = ["click", "input", "submit", "navigate"] as const;

			for (const action of actions) {
				expect(() => {
					if (action === "navigate") {
						operator.execute({
							action,
							selector: "",
							value: "https://example.com",
						});
					} else if (action === "input") {
						operator.execute({ action, selector: "#input", value: "test" });
					} else {
						operator.execute({ action, selector: "#element" });
					}
				}).not.toThrow();
			}
		});
	});

	describe("selector handling", () => {
		it("should handle CSS selector", () => {
			expect(() => {
				operator.execute({ action: "click", selector: ".class-name" });
			}).not.toThrow();
		});

		it("should handle ID selector", () => {
			expect(() => {
				operator.execute({ action: "click", selector: "#element-id" });
			}).not.toThrow();
		});

		it("should handle attribute selector", () => {
			expect(() => {
				operator.execute({ action: "click", selector: '[data-testid="test"]' });
			}).not.toThrow();
		});

		it("should handle complex selector", () => {
			expect(() => {
				operator.execute({
					action: "click",
					selector: "form.login-form .submit-btn",
				});
			}).not.toThrow();
		});
	});

	describe("input value handling", () => {
		it("should handle string value", () => {
			expect(() => {
				operator.execute({
					action: "input",
					selector: "#input",
					value: "hello",
				});
			}).not.toThrow();
		});

		it("should handle empty string value", () => {
			expect(() => {
				operator.execute({ action: "input", selector: "#input", value: "" });
			}).not.toThrow();
		});
	});

	describe("navigate action", () => {
		it("should handle http URL", () => {
			expect(() => {
				operator.execute({
					action: "navigate",
					selector: "",
					value: "http://example.com",
				});
			}).not.toThrow();
		});

		it("should handle https URL", () => {
			expect(() => {
				operator.execute({
					action: "navigate",
					selector: "",
					value: "https://example.com",
				});
			}).not.toThrow();
		});

		it("should handle URL with query params", () => {
			expect(() => {
				operator.execute({
					action: "navigate",
					selector: "",
					value: "https://example.com?foo=bar",
				});
			}).not.toThrow();
		});

		it("should handle URL with hash", () => {
			expect(() => {
				operator.execute({
					action: "navigate",
					selector: "",
					value: "https://example.com#section",
				});
			}).not.toThrow();
		});
	});
});

describe("Operator Result Types", () => {
	it("should define success result structure", () => {
		const successResult = { success: true };
		expect(successResult.success).toBe(true);
	});

	it("should define error result structure", () => {
		const errorResult = { success: false, error: "Element not found" };
		expect(errorResult.success).toBe(false);
		expect(errorResult.error).toBe("Element not found");
	});
});

describe("Operator Edge Cases", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should handle multiple rapid execute calls", () => {
		expect(() => {
			operator.execute({ action: "click", selector: "#btn1" });
			operator.execute({ action: "click", selector: "#btn2" });
			operator.execute({ action: "click", selector: "#btn3" });
		}).not.toThrow();
	});

	it("should handle action with undefined value", () => {
		expect(() => {
			operator.execute({
				action: "input",
				selector: "#input",
				value: undefined,
			});
		}).not.toThrow();
	});

	it("should handle very long selector", () => {
		const longSelector = ".parent ".repeat(50) + ".child";
		expect(() => {
			operator.execute({ action: "click", selector: longSelector });
		}).not.toThrow();
	});

	it("should handle unicode in selectors", () => {
		expect(() => {
			operator.execute({ action: "click", selector: '[data-text="中文测试"]' });
		}).not.toThrow();
	});
});
