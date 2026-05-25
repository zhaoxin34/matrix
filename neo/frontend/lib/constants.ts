/** @type {import('next').Metadata} */
export const metadata: Record<string, string> = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  API_TIMEOUT: "30000",

  // App Configuration
  APP_NAME: "Neo Agent",
  APP_VERSION: "0.1.0",

  // Theme
  DEFAULT_THEME: "system",

  // Recording
  RRWEB_SESSION_KEY: "neo_session_id",
};
