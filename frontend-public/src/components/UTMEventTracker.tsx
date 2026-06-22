"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const COOKIE_NAME = "recv_attr";

type AttributionCookie = {
  attribution_id?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landing_path?: string;
  referrer?: string;
  ref_code?: string;
};

function sanitizeRefCode(value: string | null) {
  const code = (value || "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{2,39}$/.test(code) ? code : "";
}

function readCookie(): AttributionCookie | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as AttributionCookie;
  } catch {
    return null;
  }
}

function writeCookie(value: AttributionCookie) {
  const maxAge = 60 * 60 * 24 * 90;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function currentAttribution(pathname: string, params: URLSearchParams) {
  const current = readCookie();
  if (current?.attribution_id) return current;

  const refCode = sanitizeRefCode(params.get("ref"));
  const hasUTMSource = Boolean(params.get("utm_source") || params.get("gclid") || params.get("fbclid"));
  const source = params.get("utm_source") || params.get("gclid") || params.get("fbclid") || (refCode ? "ref" : "");
  const referrer = document.referrer && !document.referrer.includes(window.location.host) ? document.referrer : "";
  if (!source && !referrer) return null;

  const next: AttributionCookie = {
    attribution_id: crypto.randomUUID?.() || `${Date.now()}`,
    source: source || (referrer ? "referral" : ""),
    medium: params.get("utm_medium") || (refCode && !hasUTMSource ? "partner" : "") || (referrer ? "referral" : ""),
    campaign: params.get("utm_campaign") || (refCode && !hasUTMSource ? refCode : ""),
    term: params.get("utm_term") || "",
    content: params.get("utm_content") || "",
    landing_path: `${pathname}${window.location.search}`,
    referrer,
    ref_code: refCode,
  };
  writeCookie(next);
  return next;
}

function sendUTMEvent(attr: AttributionCookie, eventName: string, path: string, properties: Record<string, unknown> = {}) {
  if (!attr.attribution_id) return;
  const body = JSON.stringify({
    attribution_id: attr.attribution_id,
    event_name: eventName,
    source: attr.source || "",
    medium: attr.medium || "",
    campaign: attr.campaign || "",
    term: attr.term || "",
    content: attr.content || "",
    path,
    title: document.title || "",
    referrer: attr.referrer || "",
    properties,
  });
  if (navigator.sendBeacon && navigator.sendBeacon("/api/public/utm-event", new Blob([body], { type: "application/json" }))) {
    return;
  }
  void fetch("/api/public/utm-event", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}

function pageEventName(path: string) {
  if (path.includes("/docs")) return "docs_page_view";
  if (path.startsWith("/app")) return "app_open";
  return "page_view";
}

function isTelegramBotHref(href: string) {
  if (!href) return false;
  try {
    const url = new URL(href, window.location.origin);
    return url.hostname === "t.me" && url.pathname.replace(/^\/+/, "").toLowerCase() === "recvmoney_bot";
  } catch {
    return false;
  }
}

export function UTMEventTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const attr = currentAttribution(pathname, params);
    if (!attr?.attribution_id) return;
    const path = `${pathname}${window.location.search}`;
    sendUTMEvent(attr, pageEventName(path), path);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      const attr = readCookie();
      if (!attr?.attribution_id) return;
      const href = target.getAttribute("href") || "";
      const isBotHref = isTelegramBotHref(href);
      if (!isBotHref && !href.startsWith("/app") && !href.includes("/docs")) return;
      const eventName = isBotHref ? "bot_open" : href.startsWith("/app") ? "app_open" : "docs_open";
      sendUTMEvent(attr, eventName, `${pathname}${window.location.search}`, { href });
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname]);

  return null;
}
