/**
 * Content Overlay Module
 * Handles Shadow DOM overlay and recording indicator UI
 */

import { createLogger } from "@shared/utils";

const logger = createLogger("Overlay");

/** Overlay state */
export type OverlayState = "recording" | "paused" | "idle";

/** Overlay module interface */
export interface OverlayModule {
	create: () => void;
	destroy: () => void;
	show: () => void;
	hide: () => void;
	updateState: (state: OverlayState) => void;
	updateDuration: (seconds: number) => void;
	isCreated: () => boolean;
}

/** Create overlay module */
export function createOverlay(): OverlayModule {
	// State
	let _hostElement: HTMLElement | null = null;
	let _shadowRoot: ShadowRoot | null = null;
	let _indicatorElement: HTMLElement | null = null;
	let _durationElement: HTMLElement | null = null;
	let _updateTimer: ReturnType<typeof setInterval> | null = null;

	/** Create the overlay */
	function create(): void {
		if (_hostElement) {
			logger.warn("Overlay already created");
			return;
		}

		logger.info("Creating overlay");

		// Create shadow host
		_hostElement = document.createElement("div");
		_hostElement.id = "neo-agent-overlay-host";
		_hostElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;

		// Attach shadow DOM
		_shadowRoot = _hostElement.attachShadow({ mode: "open" });

		// Add styles
		const style = document.createElement("style");
		style.textContent = `
      :host {
        display: block;
      }

      .overlay-container {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .recording-indicator {
        position: fixed;
        top: 16px;
        right: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 8px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: white;
        background: #374151;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        pointer-events: auto;
        transition: all 0.3s ease;
      }

      .recording-indicator.recording {
        background: #ef4444;
      }

      .recording-indicator.paused {
        background: #f59e0b;
      }

      .recording-indicator.idle {
        background: #6b7280;
      }

      .indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      .recording-indicator.recording .indicator-dot {
        animation: pulse 1.5s infinite;
      }

      .recording-indicator.paused .indicator-dot {
        animation: none;
        opacity: 0.7;
      }

      .duration {
        font-variant-numeric: tabular-nums;
        opacity: 0.9;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `;

		// Create indicator container
		const container = document.createElement("div");
		container.className = "overlay-container";

		// Create indicator element
		_indicatorElement = document.createElement("div");
		_indicatorElement.className = "recording-indicator idle";

		// Create indicator dot
		const dot = document.createElement("span");
		dot.className = "indicator-dot";

		// Create indicator text
		const text = document.createElement("span");
		text.className = "indicator-text";
		text.textContent = "Neo Agent";

		// Create duration
		_durationElement = document.createElement("span");
		_durationElement.className = "duration";
		_durationElement.textContent = "00:00";

		// Append children
		_indicatorElement.appendChild(dot);
		_indicatorElement.appendChild(text);
		_indicatorElement.appendChild(_durationElement);

		// Append elements
		_shadowRoot.appendChild(style);
		_shadowRoot.appendChild(_indicatorElement);

		// Append to document
		document.body.appendChild(_hostElement);

		logger.info("Overlay created");
	}

	/** Destroy the overlay */
	function destroy(): void {
		if (!_hostElement) {
			logger.warn("Overlay not created");
			return;
		}

		logger.info("Destroying overlay");

		// Stop update timer
		if (_updateTimer) {
			clearInterval(_updateTimer);
			_updateTimer = null;
		}

		// Remove from document
		_hostElement.remove();
		_hostElement = null;
		_shadowRoot = null;
		_indicatorElement = null;
		_durationElement = null;

		logger.info("Overlay destroyed");
	}

	/** Show the overlay */
	function show(): void {
		if (!_hostElement) {
			logger.warn("Overlay not created");
			return;
		}

		_hostElement.style.display = "block";
	}

	/** Hide the overlay */
	function hide(): void {
		if (!_hostElement) {
			logger.warn("Overlay not created");
			return;
		}

		_hostElement.style.display = "none";
	}

	/** Update recording state */
	function updateState(state: OverlayState): void {
		if (!_indicatorElement) {
			return;
		}

		// Update class names
		_indicatorElement.className = `recording-indicator ${state}`;

		// Update text
		const textElement = _indicatorElement.querySelector(".indicator-text");
		if (textElement) {
			switch (state) {
				case "recording":
					textElement.textContent = "Recording";
					break;
				case "paused":
					textElement.textContent = "Paused";
					break;
				case "idle":
					textElement.textContent = "Neo Agent";
					break;
			}
		}

		logger.debug("Overlay state updated:", state);
	}

	/** Update duration display */
	function updateDuration(seconds: number): void {
		if (!_durationElement) {
			return;
		}

		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		_durationElement.textContent = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	}

	/** Check if overlay is created */
	function isCreated(): boolean {
		return _hostElement !== null;
	}

	// Public API
	return {
		create,
		destroy,
		show,
		hide,
		updateState,
		updateDuration,
		isCreated,
	};
}

/** Default overlay instance */
export const overlay = createOverlay();
