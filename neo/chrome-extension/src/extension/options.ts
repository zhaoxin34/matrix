/**
 * Extension Options Page
 */

import { createLogger } from "@shared/utils";

const logger = createLogger("Options");

/**
 * Initialize options page
 */
function initialize(): void {
  logger.info("Initializing options page");

  // Load saved configuration
  loadConfiguration();

  // Set up event listeners
  setupEventListeners();
}

/**
 * Load saved configuration from storage
 */
async function loadConfiguration(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(["config"]);
    if (result.config) {
      const config = result.config;
      logger.info("Configuration loaded:", config);

      // Update form fields
      (document.getElementById("frontend-url") as HTMLInputElement).value =
        config.frontendUrl || "";
      (document.getElementById("backend-url") as HTMLInputElement).value =
        config.backendUrl || "";
      (
        document.getElementById("enable-recording") as HTMLInputElement
      ).checked = config.enableRecording ?? true;
      (document.getElementById("enable-overlay") as HTMLInputElement).checked =
        config.enableOverlay ?? true;
    }
  } catch (error) {
    logger.error("Failed to load configuration:", error);
  }
}

/**
 * Save configuration to storage
 */
async function saveConfiguration(): Promise<void> {
  const config = {
    frontendUrl: (document.getElementById("frontend-url") as HTMLInputElement)
      .value,
    backendUrl: (document.getElementById("backend-url") as HTMLInputElement)
      .value,
    enableRecording: (
      document.getElementById("enable-recording") as HTMLInputElement
    ).checked,
    enableOverlay: (
      document.getElementById("enable-overlay") as HTMLInputElement
    ).checked,
  };

  try {
    await chrome.storage.local.set({ config });
    logger.info("Configuration saved:", config);
    showStatus("Configuration saved!");
  } catch (error) {
    logger.error("Failed to save configuration:", error);
    showStatus("Failed to save configuration", true);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners(): void {
  // Save button
  const saveBtn = document.getElementById("save-btn");
  saveBtn?.addEventListener("click", saveConfiguration);

  // Reset button
  const resetBtn = document.getElementById("reset-btn");
  resetBtn?.addEventListener("click", async () => {
    await chrome.storage.local.clear();
    location.reload();
  });
}

/**
 * Show status message
 */
function showStatus(message: string, isError = false): void {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#ef4444" : "#22c55e";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initialize);
