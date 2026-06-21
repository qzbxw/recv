import { getApiBase } from "./api/core";

export type AttributionPayload = {
  attribution_id?: string;
  touch_type?: "first" | "last";
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landing_path?: string;
  referrer?: string;
  ref_code?: string;
};

type UTMEventPayload = {
  event_name: string;
  path?: string;
  title?: string;
  properties?: Record<string, unknown>;
};

// sanitizeRefCode mirrors the backend referral code rules so obviously broken
// values never reach the cookie.
export function sanitizeRefCode(value: string | null | undefined) {
  const code = (value || "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{2,39}$/.test(code) ? code : "";
}

export function readRefCode() {
  return sanitizeRefCode(readAttribution()?.ref_code);
}

export function readAttribution(): AttributionPayload | undefined {
  const match = document.cookie.match(/(?:^|;\s*)recv_attr=([^;]+)/);
  if (!match) return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as AttributionPayload;
    return parsed && Object.keys(parsed).length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeAttribution(value: AttributionPayload) {
  const maxAge = 60 * 60 * 24 * 90;
  document.cookie = `recv_attr=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

const VISIT_SENT_KEY = "recv_utm_visit_sent";

function reportVisit(payload: AttributionPayload, search: string) {
  try {
    if (sessionStorage.getItem(VISIT_SENT_KEY) === search) return;
    sessionStorage.setItem(VISIT_SENT_KEY, search);
  } catch {
    // Private mode without sessionStorage: still report, at worst a duplicate.
  }
  const body = JSON.stringify(payload);
  const url = `${getApiBase()}/api/public/utm-visit`;
  if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "application/json" }))) {
    return;
  }
  void fetch(url, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}

export function trackUTMEvent(payload: UTMEventPayload) {
  const attr = readAttribution();
  if (!attr?.attribution_id) return;
  const path = payload.path || `${window.location.pathname}${window.location.search}`;
  const body = JSON.stringify({
    attribution_id: attr.attribution_id,
    event_name: payload.event_name,
    source: attr.source || "",
    medium: attr.medium || "",
    campaign: attr.campaign || "",
    term: attr.term || "",
    content: attr.content || "",
    path,
    title: payload.title || document.title || "",
    referrer: attr.referrer || "",
    properties: payload.properties || {},
  });
  const url = `${getApiBase()}/api/public/utm-event`;
  if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "application/json" }))) {
    return;
  }
  void fetch(url, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}

export function trackUTMPageView(path: string, title?: string) {
  const eventName = path.includes("/docs") || path.includes("/developers") ? "docs_page_view" : path.startsWith("/app") || ["/auth", "/console", "/developer-portal"].some((prefix) => path.startsWith(prefix)) ? "app_open" : "page_view";
  trackUTMEvent({ event_name: eventName, path, title });
}

// captureAttribution mirrors AttributionCapture on the public site: ads can
// link straight into /app/* (e.g. /app/auth), so the SPA must also persist the
// recv_attr cookie and count the landing as a campaign visit.
export function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const refCode = sanitizeRefCode(params.get("ref"));
  const source = params.get("utm_source") || (params.get("gclid") ? "gclid" : params.get("fbclid") ? "fbclid" : "") || (refCode ? "ref" : "");
  const referrer = document.referrer && !document.referrer.includes(window.location.host) ? document.referrer : "";
  if (!source && !referrer) return;

  const isRefOnly = source === "ref";
  const current = readAttribution();
  const landingPath = `${window.location.pathname}${window.location.search}`;
  const next: AttributionPayload = {
    attribution_id: current?.attribution_id || crypto.randomUUID?.() || `${Date.now()}`,
    touch_type: "last",
    source: source || current?.source || "referral",
    medium: params.get("utm_medium") || (isRefOnly ? "partner" : "") || current?.medium || (referrer ? "referral" : ""),
    campaign: params.get("utm_campaign") || (isRefOnly ? refCode : "") || current?.campaign || "",
    term: params.get("utm_term") || current?.term || "",
    content: params.get("utm_content") || current?.content || "",
    landing_path: current?.landing_path || landingPath,
    referrer: current?.referrer || referrer,
    ref_code: refCode || current?.ref_code || "",
  };
  writeAttribution(next);

  if (!source) return;
  reportVisit({
    attribution_id: next.attribution_id,
    source,
    medium: params.get("utm_medium") || (isRefOnly ? "partner" : ""),
    campaign: params.get("utm_campaign") || (isRefOnly ? refCode : ""),
    term: params.get("utm_term") || "",
    content: params.get("utm_content") || "",
    landing_path: landingPath,
    referrer,
  }, window.location.search);
}
