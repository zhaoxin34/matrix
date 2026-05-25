/**
 * Extension Popup UI
 */

import {
  MessageType,
  AgentConfig,
  AgentMode,
  createMessage,
} from "@shared/types";
import { createLogger } from "@shared/utils";

const logger = createLogger("Popup");

/**
 * Initialize popup UI
 */
function initialize(): void {
  logger.info("Initializing popup");

  // Get current state
  chrome.runtime.sendMessage(
    createMessage(MessageType.GET_STATE),
    (response) => {
      if (response?.payload?.config) {
        updateUI(response.payload.config as AgentConfig);
      }
    },
  );

  // Set up event listeners
  setupEventListeners();
}

/**
 * Update UI with current state
 */
function updateUI(config: AgentConfig): void {
  const modeSelect = document.getElementById(
    "mode-select",
  ) as HTMLSelectElement;
  const recordingToggle = document.getElementById(
    "recording-toggle",
  ) as HTMLInputElement;
  const statusText = document.getElementById("status-text");

  if (modeSelect) {
    modeSelect.value = config.mode;
  }

  if (statusText) {
    statusText.textContent = config.enableRecording
      ? "Recording enabled"
      : "Recording disabled";
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  // Mode selector
  const modeSelect = document.getElementById("mode-select");
  modeSelect?.addEventListener("change", (e) => {
    const mode = (e.target as HTMLSelectElement).value as AgentMode;
    logger.info("Mode changed:", mode);
    // TODO: Send message to background to update config
  });

  // Recording toggle
  const recordingToggle = document.getElementById("recording-toggle");
  recordingToggle?.addEventListener("change", (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    logger.info("Recording toggled:", enabled);
    // TODO: Send message to background to toggle recording
  });

  // Open options
  const optionsBtn = document.getElementById("open-options");
  optionsBtn?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initialize);

// Add popup styles
const style = document.createElement("style");
style.textContent = `
  body {
    width: 320px;
    padding: 16px;
    font-family: system-ui, sans-serif;
    background: #f9fafb;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }
  .header h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  .section {
    background: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .section-title {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  select, input[type="checkbox"] {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
  }
  button {
    width: 100%;
    padding: 10px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }
  button:hover {
    background: #2563eb;
  }
`;
document.head.appendChild(style);
