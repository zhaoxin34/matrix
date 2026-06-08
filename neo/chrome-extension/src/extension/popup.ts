/**
 * Extension Popup UI - Configuration Management Only
 *
 * Responsibilities:
 * - Read/write configuration from chrome.storage.local
 * - Display configuration form
 * - Notify Content Script when configuration changes
 *
 * NOT responsible for:
 * - Mode selection (handled by iframe)
 * - Recording controls (handled by iframe)
 * - Status display (handled by iframe)
 */

import { createLogger } from "@shared/utils";

const logger = createLogger("Popup");

/** Default configuration */
const DEFAULT_CONFIG = {
	frontendUrl: "http://localhost:3300",
	backendUrl: "http://localhost:8000",
	enableOverlay: true,
	enableRecording: true,
};

/** Current configuration state */
let _config: typeof DEFAULT_CONFIG = { ...DEFAULT_CONFIG };

/**
 * Initialize popup UI
 */
function initialize(): void {
	logger.info("Initializing popup");

	injectStyles();
	loadConfig();
	setupEventListeners();
}

/**
 * Load configuration from chrome.storage
 */
async function loadConfig(): Promise<void> {
	try {
		const result = await chrome.storage.local.get(Object.keys(DEFAULT_CONFIG));
		_config = { ...DEFAULT_CONFIG, ...result };
		logger.info("Config loaded:", _config);
		renderConfig();
	} catch (error) {
		logger.error("Failed to load config:", error);
	}
}

/**
 * Save configuration to chrome.storage and notify Content Script
 */
async function saveConfig(
	updates: Partial<typeof DEFAULT_CONFIG>,
): Promise<void> {
	_config = { ..._config, ...updates };

	try {
		// Save to chrome.storage
		await chrome.storage.local.set(_config);
		logger.info("Config saved:", _config);

		// Notify Content Script about config change
		chrome.runtime.sendMessage({
			type: "CONFIG_UPDATED",
			payload: updates,
		});

		showSaveSuccess();
	} catch (error) {
		logger.error("Failed to save config:", error);
		showSaveError();
	}
}

/**
 * Show save success indicator
 */
function showSaveSuccess(): void {
	const indicator = document.getElementById("save-indicator");
	if (indicator) {
		indicator.textContent = "✓ Saved";
		indicator.style.color = "#10b981";
		setTimeout(() => {
			indicator.textContent = "";
		}, 2000);
	}
}

/**
 * Show save error indicator
 */
function showSaveError(): void {
	const indicator = document.getElementById("save-indicator");
	if (indicator) {
		indicator.textContent = "✗ Error";
		indicator.style.color = "#ef4444";
	}
}

/**
 * Render configuration form
 */
function renderConfig(): void {
	// Frontend URL
	const frontendInput = document.getElementById(
		"frontend-url",
	) as HTMLInputElement;
	if (frontendInput) {
		frontendInput.value = _config.frontendUrl;
	}

	// Backend URL
	const backendInput = document.getElementById(
		"backend-url",
	) as HTMLInputElement;
	if (backendInput) {
		backendInput.value = _config.backendUrl;
	}

	// Enable Overlay toggle
	const overlayToggle = document.getElementById(
		"enable-overlay",
	) as HTMLInputElement;
	if (overlayToggle) {
		overlayToggle.checked = _config.enableOverlay;
	}

	// Enable Recording toggle
	const recordingToggle = document.getElementById(
		"enable-recording",
	) as HTMLInputElement;
	if (recordingToggle) {
		recordingToggle.checked = _config.enableRecording;
	}
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
      width: 340px;
      min-height: 400px;
      padding: 20px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
      color: #111827;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .header-info {
      flex: 1;
    }

    .header h1 {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 2px;
    }

    .header-version {
      font-size: 11px;
      color: #9ca3af;
    }

    .section {
      background: white;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05),
                  0 0 0 1px rgba(0, 0, 0, 0.03);
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-title::before {
      content: "";
      display: inline-block;
      width: 3px;
      height: 12px;
      background: linear-gradient(180deg, #3b82f6, #8b5cf6);
      border-radius: 2px;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      color: #111827;
      background: #f9fafb;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input::placeholder {
      color: #9ca3af;
    }

    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .toggle-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .toggle-label {
      font-size: 14px;
      color: #374151;
    }

    .toggle-label-hint {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }

    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
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
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .toggle input:checked + .toggle-slider {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    .toggle input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    .save-indicator {
      font-size: 12px;
      font-weight: 500;
      min-height: 18px;
      text-align: right;
      margin-top: 4px;
    }

    .info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
    }

    .info-box p {
      font-size: 12px;
      color: #1e40af;
      line-height: 1.5;
    }

    .info-box strong {
      font-weight: 600;
    }

    .footer {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-link {
      font-size: 12px;
      color: #6b7280;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .footer-link:hover {
      color: #3b82f6;
      background: #f3f4f6;
      text-decoration: none;
    }
  `;
	document.head.appendChild(style);
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
	// Frontend URL input
	const frontendInput = document.getElementById("frontend-url");
	frontendInput?.addEventListener("change", (e) => {
		const value = (e.target as HTMLInputElement).value.trim();
		saveConfig({ frontendUrl: value || DEFAULT_CONFIG.frontendUrl });
	});

	// Backend URL input
	const backendInput = document.getElementById("backend-url");
	backendInput?.addEventListener("change", (e) => {
		const value = (e.target as HTMLInputElement).value.trim();
		saveConfig({ backendUrl: value || DEFAULT_CONFIG.backendUrl });
	});

	// Enable Overlay toggle
	const overlayToggle = document.getElementById("enable-overlay");
	overlayToggle?.addEventListener("change", (e) => {
		saveConfig({ enableOverlay: (e.target as HTMLInputElement).checked });
	});

	// Enable Recording toggle
	const recordingToggle = document.getElementById("enable-recording");
	recordingToggle?.addEventListener("change", (e) => {
		saveConfig({ enableRecording: (e.target as HTMLInputElement).checked });
	});

	// Open options page
	const optionsBtn = document.getElementById("open-options");
	optionsBtn?.addEventListener("click", () => {
		chrome.runtime.openOptionsPage();
	});

	// Reload iframe button
	const reloadBtn = document.getElementById("reload-iframe");
	reloadBtn?.addEventListener("click", async () => {
		logger.info("Requesting iframe reload");
		chrome.runtime.sendMessage({ type: "RELOAD_IFRAME" });
	});
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initialize);
