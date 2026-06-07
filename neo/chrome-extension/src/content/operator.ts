/**
 * Content Operator Module
 * Handles DOM operations execution (click, input, submit, navigate)
 */

import { createLogger } from "@shared/utils";

const logger = createLogger("Operator");

/** Operation result */
export interface OperationResult {
	success: boolean;
	error?: string;
	element?: string;
	timestamp: number;
}

/** Operation payload */
export interface OperationPayload {
	action: "click" | "input" | "submit" | "navigate";
	selector: string;
	fallbackSelector?: string;
	value?: string;
}

/** Callback type for operation results */
type ResultCallback = (result: OperationResult) => void;

/** Operator module interface */
export interface OperatorModule {
	execute: (payload: OperationPayload) => Promise<OperationResult>;
	click: (selector: string, fallback?: string) => Promise<OperationResult>;
	input: (
		selector: string,
		value: string,
		fallback?: string,
	) => Promise<OperationResult>;
	submit: (selector: string, fallback?: string) => Promise<OperationResult>;
	navigate: (url: string) => Promise<OperationResult>;
	onResult: (callback: ResultCallback) => void;
}

/** Create operator module */
export function createOperator(): OperatorModule {
	let _resultCallback: ResultCallback | null = null;

	/** Notify result callback */
	function notifyResult(result: OperationResult): void {
		if (_resultCallback) {
			_resultCallback(result);
		}
	}

	/** Find element by selector with fallback */
	function findElement(selector: string, fallback?: string): Element | null {
		let element = document.querySelector(selector);
		if (!element && fallback) {
			logger.warn(`Primary selector not found, trying fallback: ${fallback}`);
			element = document.querySelector(fallback);
		}
		return element;
	}

	/** Execute click operation */
	async function click(
		selector: string,
		fallback?: string,
	): Promise<OperationResult> {
		logger.info(`Click: ${selector}`);

		const element = findElement(selector, fallback);
		if (!element) {
			const error = `Element not found: ${selector}`;
			logger.error(error);
			const result: OperationResult = {
				success: false,
				error,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		}

		const htmlElement = element as HTMLElement;

		try {
			// Check if element is disabled
			if ("disabled" in htmlElement) {
				const disabledElement = htmlElement as { disabled: boolean };
				if (disabledElement.disabled) {
					const error = `Element is disabled: ${selector}`;
					logger.error(error);
					const result: OperationResult = {
						success: false,
						error,
						element: selector,
						timestamp: Date.now(),
					};
					notifyResult(result);
					return result;
				}
			}

			htmlElement.click();
			logger.info(`Click successful: ${selector}`);

			const result: OperationResult = {
				success: true,
				element: selector,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logger.error(`Click failed: ${errorMsg}`);

			const result: OperationResult = {
				success: false,
				error: errorMsg,
				element: selector,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		}
	}

	/** Execute input operation */
	async function input(
		selector: string,
		value: string,
		fallback?: string,
	): Promise<OperationResult> {
		logger.info(`Input: ${selector} = "${value}"`);

		const element = findElement(selector, fallback);
		if (!element) {
			const error = `Element not found: ${selector}`;
			logger.error(error);
			const result: OperationResult = {
				success: false,
				error,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		}

		const htmlElement = element as HTMLInputElement | HTMLTextAreaElement;
		if (htmlElement.readOnly) {
			const error = `Element is read-only: ${selector}`;
			logger.error(error);
			const result: OperationResult = {
				success: false,
				error,
				element: selector,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		}

		try {
			// Focus element
			htmlElement.focus();

			// Clear existing value
			htmlElement.value = "";

			// Set new value
			htmlElement.value = value;

			// Dispatch input event
			const inputEvent = new Event("input", { bubbles: true });
			htmlElement.dispatchEvent(inputEvent);

			// Dispatch change event
			const changeEvent = new Event("change", { bubbles: true });
			htmlElement.dispatchEvent(changeEvent);

			logger.info(`Input successful: ${selector} = "${value}"`);

			const result: OperationResult = {
				success: true,
				element: selector,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logger.error(`Input failed: ${errorMsg}`);

			const result: OperationResult = {
				success: false,
				error: errorMsg,
				element: selector,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		}
	}

	/** Execute submit operation */
	async function submit(
		selector: string,
		fallback?: string,
	): Promise<OperationResult> {
		logger.info(`Submit: ${selector}`);

		const element = findElement(selector, fallback);
		if (!element) {
			const error = `Element not found: ${selector}`;
			logger.error(error);
			const result: OperationResult = {
				success: false,
				error,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		}

		try {
			if (element instanceof HTMLFormElement) {
				element.submit();
			} else {
				// Find parent form and submit
				const form = element.closest("form");
				if (form) {
					(form as HTMLFormElement).submit();
				} else {
					throw new Error("No form found for element");
				}
			}

			logger.info(`Submit successful: ${selector}`);

			const result: OperationResult = {
				success: true,
				element: selector,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logger.error(`Submit failed: ${errorMsg}`);

			const result: OperationResult = {
				success: false,
				error: errorMsg,
				element: selector,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		}
	}

	/** Execute navigate operation */
	async function navigate(url: string): Promise<OperationResult> {
		logger.info(`Navigate: ${url}`);

		try {
			window.location.href = url;

			const result: OperationResult = {
				success: true,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logger.error(`Navigate failed: ${errorMsg}`);

			const result: OperationResult = {
				success: false,
				error: errorMsg,
				timestamp: Date.now(),
			};
			notifyResult(result);
			return result;
		}
	}

	/** Execute generic operation */
	async function execute(payload: OperationPayload): Promise<OperationResult> {
		const { action, selector, fallbackSelector, value } = payload;

		switch (action) {
			case "click": {
				return click(selector, fallbackSelector);
			}
			case "input": {
				return input(selector, value || "", fallbackSelector);
			}
			case "submit": {
				return submit(selector, fallbackSelector);
			}
			case "navigate": {
				return navigate(selector); // selector contains URL for navigate
			}
			default: {
				const error = `Unknown action: ${action}`;
				logger.error(error);
				const result: OperationResult = {
					success: false,
					error,
					timestamp: Date.now(),
				};
				notifyResult(result);
				return result;
			}
		}
	}

	// Public API
	return {
		execute,
		click,
		input,
		submit,
		navigate,
		onResult: (callback: ResultCallback) => {
			_resultCallback = callback;
		},
	};
}

/** Default operator instance */
export const operator = createOperator();
