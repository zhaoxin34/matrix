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

/** State */
let _currentConfig: AgentConfig | null = null;
let _isRecording = false;
let _isPaused = false;
let _agentMode: AgentMode = AgentMode.LEARN;

/**
 * Initialize popup UI
 */
function initialize(): void {
	logger.info("Initializing popup");

	// Add styles
	injectStyles();

	// Get current state
	chrome.runtime.sendMessage(
		createMessage(MessageType.GET_STATE),
		(response) => {
			if (response?.payload) {
				const payload = response.payload as {
					config?: AgentConfig;
					isRecording?: boolean;
					isPaused?: boolean;
					mode?: AgentMode;
				};
				if (payload.config) {
					_currentConfig = payload.config;
				}
				if (payload.isRecording !== undefined) {
					_isRecording = payload.isRecording;
				}
				if (payload.isPaused !== undefined) {
					_isPaused = payload.isPaused;
				}
				if (payload.mode) {
					_agentMode = payload.mode;
				}
				updateUI();
			}
		},
	);

	// Set up event listeners
	setupEventListeners();
}

/**
 * Inject popup styles
 */
function injectStyles(): void {
	const style = document.createElement("style");
	style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 320px;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f9fafb;
      color: #111827;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .header-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }
    .header h1 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    .section {
      background: white;
      padding: 14px;
      border-radius: 10px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .row:last-child {
      margin-bottom: 0;
    }
    .row-label {
      font-size: 14px;
      color: #374151;
    }
    select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      min-width: 120px;
    }
    select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
    }
    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #d1d5db;
      transition: 0.3s;
      border-radius: 24px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .toggle input:checked + .toggle-slider {
      background-color: #3b82f6;
    }
    .toggle input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }
    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
    }
    .status.recording {
      background: #fef2f2;
      color: #dc2626;
    }
    .status.paused {
      background: #fffbeb;
      color: #d97706;
    }
    .status.idle {
      background: #f3f4f6;
      color: #6b7280;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .status.recording .status-dot {
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
    .btn-primary:active {
      transform: translateY(0);
    }
    .btn-primary:disabled {
      background: #d1d5db;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      margin-top: 8px;
    }
    .btn-secondary:hover {
      background: #e5e7eb;
    }
    .footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: center;
    }
    .footer-link {
      font-size: 12px;
      color: #6b7280;
      text-decoration: none;
    }
    .footer-link:hover {
      color: #3b82f6;
      text-decoration: underline;
    }
  `;
	document.head.appendChild(style);
}

/**
 * Update UI with current state
 */
function updateUI(): void {
	const modeSelect = document.getElementById(
		"mode-select",
	) as HTMLSelectElement;
	const recordingToggle = document.getElementById(
		"recording-toggle",
	) as HTMLInputElement;
	const statusContainer = document.getElementById("status-container");
	const startBtn = document.getElementById("start-btn") as HTMLButtonElement;

	if (modeSelect && _currentConfig) {
		modeSelect.value = _currentConfig.mode;
	}

	if (recordingToggle && _currentConfig) {
		recordingToggle.checked = _currentConfig.enableRecording;
	}

	// Update status
	if (statusContainer) {
		statusContainer.className = "status";

		// Clear existing content
		while (statusContainer.firstChild) {
			statusContainer.removeChild(statusContainer.firstChild);
		}

		// Create status dot
		const dot = document.createElement("span");
		dot.className = "status-dot";

		// Create status text
		const text = document.createElement("span");

		if (_isRecording) {
			statusContainer.classList.add(_isPaused ? "paused" : "recording");
			text.textContent = _isPaused ? "Recording Paused" : "Recording...";
		} else {
			statusContainer.classList.add("idle");
			text.textContent = "Idle";
		}

		statusContainer.appendChild(dot);
		statusContainer.appendChild(text);
	}

	// Update button state
	if (startBtn) {
		startBtn.textContent = _isRecording ? "Stop Recording" : "Start Recording";
		startBtn.className = _isRecording ? "btn btn-secondary" : "btn btn-primary";
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
		_agentMode = mode;
		// Update config
		if (_currentConfig) {
			_currentConfig.mode = mode;
		}
		updateUI();
	});

	// Recording toggle
	const recordingToggle = document.getElementById("recording-toggle");
	recordingToggle?.addEventListener("change", (e) => {
		const enabled = (e.target as HTMLInputElement).checked;
		logger.info("Recording toggled:", enabled);
		if (_currentConfig) {
			_currentConfig.enableRecording = enabled;
		}
		updateUI();
	});

	// Start/Stop button
	const startBtn = document.getElementById("start-btn");
	startBtn?.addEventListener("click", async () => {
		logger.info("Start/Stop button clicked, current mode:", _isRecording);

		// Get current tab
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (!tab?.id) {
			logger.error("No active tab found");
			return;
		}

		if (_isRecording) {
			// Stop recording
			chrome.runtime.sendMessage(
				createMessage(MessageType.STOP_RECORDING),
				() => {
					_isRecording = false;
					_isPaused = false;
					updateUI();
					logger.info("Recording stopped");
				},
			);
		} else {
			// Start recording based on current mode
			const messageType =
				_agentMode === AgentMode.LEARN
					? MessageType.START_LEARN_MODE
					: _agentMode === AgentMode.GUIDE
						? MessageType.START_GUIDE_MODE
						: MessageType.START_ACTIVE_MODE;

			chrome.runtime.sendMessage(createMessage(messageType), () => {
				_isRecording = true;
				_isPaused = false;
				updateUI();
				logger.info("Recording started in mode:", _agentMode);
			});
		}
	});

	// Open options
	const optionsBtn = document.getElementById("open-options");
	optionsBtn?.addEventListener("click", () => {
		chrome.runtime.openOptionsPage();
	});
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initialize);
