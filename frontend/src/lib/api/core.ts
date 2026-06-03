import { ApiError } from "../errors";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const TOKEN_KEY = "recv_token";
const ADMIN_TOKEN_KEY = "recv_admin_token";

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

export async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  return requestWithRetry<T>(path, init, token, true);
}

async function requestWithRetry<T>(path: string, init: RequestInit = {}, token?: string, allowRefresh = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401 && allowRefresh && token && canRefreshForPath(path)) {
      const refreshedToken = await refreshAccessToken(path.startsWith("/api/admin/") ? "admin" : "seller");
      if (refreshedToken) {
        return requestWithRetry<T>(path, init, refreshedToken, false);
      }
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

async function refreshAccessToken(kind: "seller" | "admin") {
  const path = kind === "admin" ? "/api/admin/refresh" : "/api/auth/refresh";
  const response = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: "{}",
  });
  if (!response.ok) {
    if (kind === "admin") clearStoredAdminToken();
    else clearStoredToken();
    return "";
  }
  const payload = (await response.json()) as { token?: string; access_token?: string };
  const nextToken = payload.token || payload.access_token || "";
  if (!nextToken) return "";
  if (kind === "admin") setStoredAdminToken(nextToken);
  else setStoredToken(nextToken);
  return nextToken;
}
