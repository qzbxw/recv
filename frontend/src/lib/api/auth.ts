import type { AuthIdentity, InterfaceLanguage, MeResponse, User, Workspace } from "../types";
import type { AttributionPayload } from "../attribution";
import { getApiBase, request } from "./core";

export async function authenticateTelegram(payload: { init_data?: string; widget_data?: string; telegram_id?: number; username?: string; attribution?: AttributionPayload; ref_code?: string }) {
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

export async function loginWithTelegramCode(payload: { username: string; code: string; attribution?: AttributionPayload; ref_code?: string }) {
  return request<{ token: string; user: User; workspace: Workspace }>("/api/auth/telegram/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function validateReferralCode(code: string) {
  return request<{ valid: boolean; partner_name?: string; code?: string }>(`/api/public/referral-codes/${encodeURIComponent(code)}`);
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

export function getOAuthStartUrl(provider: "google" | "github", payload: { next?: string; ref_code?: string } = {}) {
  const params = new URLSearchParams();
  if (payload.next) params.set("next", payload.next);
  if (payload.ref_code) params.set("ref_code", payload.ref_code);
  const query = params.toString();
  return `${getApiBase()}/api/auth/oauth/${provider}/start${query ? `?${query}` : ""}`;
}

export async function listAuthIdentities(token: string) {
  return request<{ identities: AuthIdentity[] }>("/api/account/identities", {}, token);
}

export async function startAuthIdentityLink(token: string, provider: "google" | "github", payload: { redirect_path: string }) {
  return request<{ url: string }>(`/api/account/identities/${provider}/link`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateContactEmail(token: string, payload: { email: string }) {
  return request<{ user: User }>("/api/me/contact-email", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateLanguage(token: string, payload: { language: InterfaceLanguage }) {
  return request<{ workspace: Workspace; language: InterfaceLanguage }>("/api/me/language", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}
