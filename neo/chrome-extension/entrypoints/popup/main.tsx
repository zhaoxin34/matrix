/**
 * Popup entry point.
 *
 * WXT generates the manifest entry for this popup automatically. On
 * invocation, we install the messaging listener for events from the
 * content script and mount the React app.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { installPopupListener } from "../../src/messaging/popup-client";
import { bus } from "../../src/upload/api-client";
import { App } from "./App";

// Listen for events from content scripts.
installPopupListener();

// Re-export the bus so the popup's React hooks can subscribe to global
// events (e.g. `authRequired` triggered by a 401 from the API client).
(globalThis as unknown as { __agentSteerBus?: typeof bus }).__agentSteerBus = bus;

export default defineUnlistedScript(() => {
  const root = document.getElementById("root");
  if (!root) return;
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
