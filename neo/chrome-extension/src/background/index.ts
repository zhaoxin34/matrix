/**
 * Background Service Worker
 * Handles task scheduling, message routing, and offline cache management
 */

import {
  MessageType,
  AgentMessage,
  AgentConfig,
  DEFAULT_CONFIG,
  createMessage,
} from "@shared/types";
import { createLogger } from "@shared/utils";

const logger = createLogger("Background");

// Current configuration
let config: AgentConfig = { ...DEFAULT_CONFIG };

/**
 * Handle messages from content scripts and extension UI
 */
chrome.runtime.onMessage.addListener(
  (message: AgentMessage, sender, sendResponse) => {
    logger.debug("Received message:", message.type, sender.tab?.id);

    handleMessage(message, sender)
      .then((response) => sendResponse(response))
      .catch((error) => {
        logger.error("Error handling message:", error);
        sendResponse(
          createMessage(MessageType.STATE_UPDATE, { error: error.message }),
        );
      });

    // Return true to indicate async response
    return true;
  },
);

/**
 * Handle individual message types
 */
async function handleMessage(
  message: AgentMessage,
  sender: chrome.runtime.MessageSender,
): Promise<AgentMessage> {
  switch (message.type) {
    case MessageType.GET_STATE:
      return createMessage(MessageType.STATE_UPDATE, {
        config,
        tabId: sender.tab?.id,
      });

    case MessageType.IFRAME_MESSAGE:
      return handleIframeMessage(message, sender);

    default:
      logger.warn("Unknown message type:", message.type);
      return createMessage(MessageType.STATE_UPDATE, {
        error: "Unknown message type",
      });
  }
}

/**
 * Handle iframe messages - forward to appropriate content script
 */
async function handleIframeMessage(
  message: AgentMessage,
  sender: chrome.runtime.MessageSender,
): Promise<AgentMessage> {
  const tabId = sender.tab?.id;
  if (!tabId) {
    return createMessage(MessageType.STATE_UPDATE, { error: "No tab ID" });
  }

  try {
    // Forward message to content script
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    logger.error("Failed to forward message to content script:", error);
    return createMessage(MessageType.STATE_UPDATE, {
      error: "Failed to communicate with page",
    });
  }
}

/**
 * Handle extension installation or update
 */
chrome.runtime.onInstalled.addListener((details) => {
  logger.info("Extension installed/updated:", details.reason);

  if (details.reason === "install") {
    // Initialize default configuration
    chrome.storage.local.set({ config: DEFAULT_CONFIG });
    logger.info("Default configuration initialized");
  }
});

/**
 * Handle startup
 */
chrome.runtime.onStartup.addListener(() => {
  logger.info("Extension startup");
});

logger.info("Background service worker initialized");
