import type { MeResponse, User, Workspace } from "../types";
import type { AttributionPayload } from "../attribution";
import { request } from "./core";

export async function authenticateTelegram(payload: { init_data?: string; widget_data?: string; telegram_id?: number; username?: string; attribution?: AttributionPayload }) {
  return request<{ token: string; user: User; workspace: Workspace }>("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestTelegramLoginCode(payload: { username: string }) {
  return request<{ ok: boolean }>("/api/auth/telegram/request-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginWithTelegramCode(payload: { username: string; code: string; attribution?: AttributionPayload }) {
  return request<{ token: string; user: User; workspace: Workspace }>("/api/auth/telegram/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMe(token: string) {
  return request<MeResponse>("/api/me", {}, token);
}

export async function refreshAuth(refreshToken?: string) {
  return request<{ token: string; access_token?: string; refresh_token?: string; user: User; workspace: Workspace }>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
  });
}

export async function logoutAuth(refreshToken?: string) {
  return request<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
  });
}

export async function updateContactEmail(token: string, payload: { email: string }) {
  return request<{ user: User }>("/api/me/contact-email", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateLanguage(token: string, payload: { language: "en" | "ru" }) {
  return request<{ workspace: Workspace; language: "en" | "ru" }>("/api/me/language", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}
