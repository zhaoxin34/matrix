/**
 * Content Script
 * Runs in target page context, handles recording, operations, overlay, and iframe management
 */

import {
  MessageType,
  AgentMessage,
  AgentConfig,
  DEFAULT_CONFIG,
  createMessage,
} from "@shared/types";
import { createLogger, throttle } from "@shared/utils";

const logger = createLogger("ContentScript");

// State
let config: AgentConfig = { ...DEFAULT_CONFIG };
let isRecording = false;
let isPaused = false;
let sessionId: string | null = null;

// DOM elements
let overlayElement: HTMLElement | null = null;
let iframeElement: HTMLIFrameElement | null = null;

/**
 * Initialize content script
 */
function initialize(): void {
  logger.info("Initializing content script");

  // Request current config from background
  chrome.runtime.sendMessage(
    createMessage(MessageType.GET_STATE),
    (response) => {
      if (response?.payload?.config) {
        config = response.payload.config as AgentConfig;
        logger.info("Config loaded:", config);
      }
    },
  );

  // Listen for messages from background and iframe
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  window.addEventListener("message", handleIframeMessage);

  // Create overlay if enabled
  if (config.enableOverlay) {
    createOverlay();
  }

  logger.info("Content script initialized");
}

/**
 * Handle messages from background service worker
 */
function handleBackgroundMessage(message: AgentMessage): boolean {
  logger.debug("Received message from background:", message.type);

  switch (message.type) {
    case MessageType.START_RECORDING:
      startRecording();
      break;
    case MessageType.STOP_RECORDING:
      stopRecording();
      break;
    case MessageType.PAUSE_RECORDING:
      pauseRecording();
      break;
    case MessageType.RESUME_RECORDING:
      resumeRecording();
      break;
    case MessageType.IFRAME_MESSAGE:
      handleIframeMessage(message);
      break;
  }

  return true;
}

/**
 * Handle messages from iframe
 */
function handleIframeMessage(event: MessageEvent | AgentMessage): void {
  // Handle MessageEvent from window listener
  const message = "data" in event ? (event.data as AgentMessage) : event;
  logger.debug("Received message from iframe:", message.type);

  // Forward to background
  chrome.runtime.sendMessage(
    createMessage(MessageType.IFRAME_MESSAGE, {
      sourceMessage: message,
    }),
  );

  // Handle local messages
  switch (message.type) {
    case MessageType.EXECUTE_OPERATION:
      executeOperation(message.payload);
      break;
  }
}

/**
 * Start recording
 */
function startRecording(): void {
  if (isRecording) return;

  logger.info("Starting recording");
  isRecording = true;
  isPaused = false;
  sessionId = crypto.randomUUID();

  // Send state update
  broadcastStateUpdate();
}

/**
 * Stop recording
 */
function stopRecording(): void {
  if (!isRecording) return;

  logger.info("Stopping recording, session:", sessionId);
  isRecording = false;
  isPaused = false;

  broadcastStateUpdate();
}

/**
 * Pause recording
 */
function pauseRecording(): void {
  if (!isRecording || isPaused) return;

  logger.info("Pausing recording");
  isPaused = true;

  broadcastStateUpdate();
}

/**
 * Resume recording
 */
function resumeRecording(): void {
  if (!isRecording || !isPaused) return;

  logger.info("Resuming recording");
  isPaused = false;

  broadcastStateUpdate();
}

/**
 * Execute DOM operation
 */
function executeOperation(payload: Record<string, unknown>): void {
  const { action, selector, value } = payload as {
    action: string;
    selector: string;
    value?: string;
  };

  logger.info("Executing operation:", action, selector);

  try {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    switch (action) {
      case "click":
        (element as HTMLElement).click();
        break;
      case "input":
        (element as HTMLInputElement).value = value || "";
        element.dispatchEvent(new Event("input", { bubbles: true }));
        break;
      case "submit":
        (element as HTMLFormElement).submit();
        break;
    }

    // Notify iframe of success
    iframeElement?.contentWindow?.postMessage(
      createMessage(MessageType.OPERATION_RESULT, { success: true }),
      "*",
    );
  } catch (error) {
    logger.error("Operation failed:", error);
    iframeElement?.contentWindow?.postMessage(
      createMessage(MessageType.OPERATION_RESULT, {
        success: false,
        error: (error as Error).message,
      }),
      "*",
    );
  }
}

/**
 * Broadcast state update to iframe
 */
const broadcastStateUpdate = throttle(() => {
  iframeElement?.contentWindow?.postMessage(
    createMessage(MessageType.STATE_UPDATE, {
      isRecording,
      isPaused,
      sessionId,
      config,
    }),
    "*",
  );
}, 100);

/**
 * Create Shadow DOM overlay
 */
function createOverlay(): void {
  if (overlayElement) return;

  // Create shadow host
  overlayElement = document.createElement("div");
  overlayElement.id = "neo-agent-overlay-host";
  overlayElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
  `;

  // Attach shadow DOM
  const shadow = overlayElement.attachShadow({ mode: "open" });

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    :host {
      display: block;
    }
    .recording-indicator {
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 8px 16px;
      background: #ef4444;
      color: white;
      border-radius: 4px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      pointer-events: auto;
      z-index: 2147483647;
    }
    .recording-indicator.recording {
      background: #ef4444;
    }
    .recording-indicator.paused {
      background: #f59e0b;
    }
  `;

  // Create indicator element
  const indicator = document.createElement("div");
  indicator.className = "recording-indicator";
  indicator.textContent = "Recording";

  shadow.appendChild(style);
  shadow.appendChild(indicator);

  document.body.appendChild(overlayElement);

  // Update indicator state
  const updateIndicator = () => {
    indicator.className = "recording-indicator";
    if (isRecording) {
      indicator.classList.add(isPaused ? "paused" : "recording");
      indicator.textContent = isPaused ? "Paused" : "Recording";
    }
  };

  // Periodically update indicator
  setInterval(updateIndicator, 1000);

  logger.info("Overlay created");
}

/**
 * Create iframe for Neo Frontend
 */
function createIframe(url: string): HTMLIFrameElement {
  if (iframeElement) {
    iframeElement.remove();
  }

  iframeElement = document.createElement("iframe");
  iframeElement.src = url;
  iframeElement.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    width: 400px;
    height: 600px;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    z-index: 2147483646;
  `;

  document.body.appendChild(iframeElement);

  logger.info("Iframe created:", url);

  // Notify when iframe is ready
  iframeElement.onload = () => {
    iframeElement?.contentWindow?.postMessage(
      createMessage(MessageType.IFRAME_READY, { config }),
      "*",
    );
  };

  return iframeElement;
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
