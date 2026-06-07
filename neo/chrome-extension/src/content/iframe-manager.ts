/**
 * Content Iframe Manager Module
 * Handles iframe creation, destruction, and communication
 */

import {
	AgentMessage,
	AgentMode,
	MessageType,
	createMessage,
} from "@shared/types";
import { createLogger } from "@shared/utils";

const logger = createLogger("IframeManager");

/** Iframe manager module interface */
export interface IframeManagerModule {
	create: (mode: AgentMode, token?: string) => HTMLIFrameElement;
	destroy: () => void;
	navigate: (url: string) => void;
	sendMessage: (message: AgentMessage) => void;
	onMessage: (handler: (message: AgentMessage) => void) => void;
	onReady: (handler: () => void) => void;
	isCreated: () => boolean;
}

/** Create iframe manager module */
export function createIframeManager(): IframeManagerModule {
	// State
	let _iframeElement: HTMLIFrameElement | null = null;
	let _messageHandlers: ((message: AgentMessage) => void)[] = [];
	let _readyHandlers: (() => void)[] = [];
	let _currentMode: AgentMode | null = null;
	let _frontendUrl = "http://localhost:3300";

	/** Handle messages from iframe */
	function handleMessage(event: MessageEvent): void {
		// Only handle messages from our iframe
		if (!_iframeElement || event.source !== _iframeElement.contentWindow) {
			return;
		}

		const message = event.data as AgentMessage;
		if (!message || !message.type) {
			return;
		}

		logger.debug("Received message from iframe:", message.type);

		// Notify all handlers
		_messageHandlers.forEach((handler) => {
			try {
				handler(message);
			} catch (error) {
				logger.error("Error in message handler:", error);
			}
		});
	}

	/** Handle iframe load */
	function handleLoad(): void {
		logger.info("Iframe loaded");

		// Notify ready handlers
		_readyHandlers.forEach((handler) => {
			try {
				handler();
			} catch (error) {
				logger.error("Error in ready handler:", error);
			}
		});

		// Send initial config to iframe
		if (_iframeElement?.contentWindow) {
			_iframeElement.contentWindow.postMessage(
				createMessage(MessageType.IFRAME_READY, {
					mode: _currentMode,
					frontendUrl: _frontendUrl,
				}),
				"*",
			);
		}
	}

	/** Build iframe URL with parameters */
	function buildUrl(mode: AgentMode, token?: string): string {
		const baseUrl = `${_frontendUrl}/#/agent/mode`;
		const params = new URLSearchParams();
		params.set("mode", mode);

		if (token) {
			params.set("token", token);
		}

		return `${baseUrl}?${params.toString()}`;
	}

	/** Create iframe */
	function create(mode: AgentMode, token?: string): HTMLIFrameElement {
		// If iframe already exists, just navigate to new URL
		if (_iframeElement) {
			logger.info("Iframe exists, navigating to new mode:", mode);
			_currentMode = mode;
			navigate(buildUrl(mode, token));
			return _iframeElement;
		}

		logger.info("Creating iframe for mode:", mode);
		_currentMode = mode;

		// Create iframe element
		_iframeElement = document.createElement("iframe");
		_iframeElement.src = buildUrl(mode, token);
		_iframeElement.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      width: 400px;
      height: 600px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 2147483646;
      background: white;
      transition: opacity 0.3s ease;
    `;

		// Set attributes
		_iframeElement.allow = "clipboard-read; clipboard-write";
		_iframeElement.title = "Neo Agent";

		// Add load event listener
		_iframeElement.onload = handleLoad;

		// Add to document
		document.body.appendChild(_iframeElement);

		// Add message listener
		window.addEventListener("message", handleMessage);

		// Add ESC key listener
		document.addEventListener("keydown", handleKeyDown);

		logger.info("Iframe created:", _iframeElement.src);

		return _iframeElement;
	}

	/** Destroy iframe */
	function destroy(): void {
		if (!_iframeElement) {
			logger.warn("No iframe to destroy");
			return;
		}

		logger.info("Destroying iframe");

		// Remove event listeners
		window.removeEventListener("message", handleMessage);
		document.removeEventListener("keydown", handleKeyDown);

		// Remove iframe
		_iframeElement.remove();
		_iframeElement = null;
		_currentMode = null;

		logger.info("Iframe destroyed");
	}

	/** Navigate iframe to new URL */
	function navigate(url: string): void {
		if (!_iframeElement) {
			logger.warn("No iframe to navigate");
			return;
		}

		logger.info("Navigating iframe to:", url);
		_iframeElement.src = url;
	}

	/** Send message to iframe */
	function sendMessage(message: AgentMessage): void {
		if (!_iframeElement?.contentWindow) {
			logger.warn("No iframe or content window to send message");
			return;
		}

		logger.debug("Sending message to iframe:", message.type);
		_iframeElement.contentWindow.postMessage(message, "*");
	}

	/** Register message handler */
	function onMessage(handler: (message: AgentMessage) => void): void {
		_messageHandlers.push(handler);
	}

	/** Register ready handler */
	function onReady(handler: () => void): void {
		_readyHandlers.push(handler);
	}

	/** Check if iframe is created */
	function isCreated(): boolean {
		return _iframeElement !== null;
	}

	/** Handle keydown events */
	function handleKeyDown(event: KeyboardEvent): void {
		// ESC key to close iframe
		if (event.key === "Escape" && _iframeElement) {
			logger.info("ESC pressed, closing iframe");
			destroy();
		}
	}

	// Public API
	return {
		create,
		destroy,
		navigate,
		sendMessage,
		onMessage,
		onReady,
		isCreated,
	};
}

/** Default iframe manager instance */
export const iframeManager = createIframeManager();
