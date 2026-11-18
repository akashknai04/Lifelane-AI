// LifeLane AI — Driver App Network Configuration
// Configurable via Vite environment variables:
// - VITE_API_BASE_URL (defaults to http://localhost:8000)
// - VITE_WS_BASE_URL  (defaults to ws://localhost:8000 or auto-derived from API_BASE)

const defaultHttp = "http://localhost:8000";
const rawApi = import.meta.env.VITE_API_BASE_URL || defaultHttp;
export const API_BASE = rawApi.replace(/\/+$/, "");

// If VITE_WS_BASE_URL is not set, derive from API_BASE (handles http->ws and https->wss)
const derivedWs = API_BASE.startsWith("https://")
  ? API_BASE.replace(/^https:\/\//, "wss://")
  : API_BASE.replace(/^http:\/\//, "ws://");

export const WS_BASE = (import.meta.env.VITE_WS_BASE_URL || derivedWs).replace(/\/+$/, "");
