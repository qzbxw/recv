import { ApiError } from "../errors";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const TOKEN_KEY = "recv_token";
const ADMIN_TOKEN_KEY = "recv_admin_token";
const ADMIN_REFRESH_TOKEN_KEY = "recv_admin_refresh_token";
let sellerRefreshPromise: Promise<string> | null = null;
let adminRefreshPromise: Promise<string> | null = null;

export function getApiBase() {
  return API_BASE;
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredAdminToken() {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setStoredAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearStoredAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getStoredAdminRefreshToken() {
  return window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
}

export function setStoredAdminRefreshToken(token: string) {
  if (token) {
    window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, token);
  } else {
    clearStoredAdminRefreshToken();
  }
}

export function clearStoredAdminRefreshToken() {
  window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
}

export async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  return requestWithRetry<T>(path, init, token, true);
}

async function requestWithRetry<T>(path: string, init: RequestInit = {}, token?: string, allowRefresh = true): Promise<T> {
  let activeToken = token;
  const isAuthRequired = !path.includes("/login") && !path.includes("/logout") && !path.includes("/refresh") && !path.includes("/public/");
  if (isAuthRequired) {
    if (path.startsWith("/api/admin/")) {
      activeToken = getStoredAdminToken() || token;
    } else {
      activeToken = getStoredToken() || token;
    }
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (activeToken) {
    headers.set("Authorization", `Bearer ${activeToken}`);
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401 && allowRefresh && activeToken && canRefreshForPath(path)) {
      const refreshedToken = await refreshAccessToken(path.startsWith("/api/admin/") ? "admin" : "seller");
      if (refreshedToken) {
        return requestWithRetry<T>(path, init, refreshedToken, false);
      }
    }
    if (response.status === 401 && activeToken && canRefreshForPath(path)) {
      const eventName = path.startsWith("/api/admin/") ? "recv_admin_unauthorized" : "recv_seller_unauthorized";
      window.dispatchEvent(new CustomEvent(eventName));
    }
    const payload = (await response.json().catch(() => ({ error: "Request failed" }))) as { error?: string };
    throw new ApiError(response.status, payload.error || `Request failed: ${response.status}`, payload.error);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function canRefreshForPath(path: string) {
  return !path.includes("/login") && !path.includes("/logout") && !path.includes("/refresh") && !path.includes("/public/");
}

function refreshAccessToken(kind: "seller" | "admin") {
  const pendingRefresh = kind === "admin" ? adminRefreshPromise : sellerRefreshPromise;
  if (pendingRefresh) {
    return pendingRefresh;
  }

  const refreshPromise = performAccessTokenRefresh(kind).finally(() => {
    if (kind === "admin") adminRefreshPromise = null;
    else sellerRefreshPromise = null;
  });

  if (kind === "admin") adminRefreshPromise = refreshPromise;
  else sellerRefreshPromise = refreshPromise;

  return refreshPromise;
}

async function performAccessTokenRefresh(kind: "seller" | "admin") {
  const path = kind === "admin" ? "/api/admin/refresh" : "/api/auth/refresh";
  const adminRefreshToken = kind === "admin" ? getStoredAdminRefreshToken() : "";
  const response = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(adminRefreshToken ? { refresh_token: adminRefreshToken } : {}),
  });
  if (!response.ok) {
    if (kind === "admin") {
      clearStoredAdminToken();
      clearStoredAdminRefreshToken();
    } else {
      clearStoredToken();
    }
    return "";
  }
  const payload = (await response.json()) as { token?: string; access_token?: string };
  const nextToken = payload.token || payload.access_token || "";
  if (!nextToken) {
    if (kind === "admin") {
      clearStoredAdminToken();
      clearStoredAdminRefreshToken();
    } else {
      clearStoredToken();
    }
    return "";
  }
  if (kind === "admin") setStoredAdminToken(nextToken);
  else setStoredToken(nextToken);
  return nextToken;
}
