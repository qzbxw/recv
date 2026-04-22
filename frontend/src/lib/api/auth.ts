import type { MeResponse, User, Workspace } from "../types";
import { request } from "./core";

export async function authenticateTelegram(payload: { init_data?: string; widget_data?: string; telegram_id?: number; username?: string }) {
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

export async function loginWithTelegramCode(payload: { username: string; code: string }) {
  return request<{ token: string; user: User; workspace: Workspace }>("/api/auth/telegram/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMe(token: string) {
  return request<MeResponse>("/api/me", {}, token);
}

export async function updateContactEmail(token: string, payload: { email: string }) {
  return request<{ user: User }>("/api/me/contact-email", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

