"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const COOKIE_NAME = "recv_attr";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "ref"] as const;

// Mirrors the backend referral code rules so broken values never reach the cookie.
function sanitizeRefCode(value: string | null) {
  const code = (value || "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{2,39}$/.test(code) ? code : "";
}

function readCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as Record<string, string>;
  } catch {
    return null;
  }
}

function writeCookie(value: Record<string, string>) {
  const maxAge = 60 * 60 * 24 * 90;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

const VISIT_SENT_KEY = "recv_utm_visit_sent";

function reportVisit(params: URLSearchParams, attributionId: string, landingPath: string, referrer: string) {
  const refCode = sanitizeRefCode(params.get("ref"));
  const source = params.get("utm_source") || (params.get("gclid") ? "gclid" : params.get("fbclid") ? "fbclid" : "") || (refCode ? "ref" : "");
  if (!source) return;
  const isRefOnly = source === "ref";
  try {
    if (sessionStorage.getItem(VISIT_SENT_KEY) === params.toString()) return;
    sessionStorage.setItem(VISIT_SENT_KEY, params.toString());
  } catch {
    // Private mode without sessionStorage: still report, at worst a duplicate.
  }
  const body = JSON.stringify({
    attribution_id: attributionId,
    source,
    medium: params.get("utm_medium") || (isRefOnly ? "partner" : ""),
    campaign: params.get("utm_campaign") || (isRefOnly ? refCode : ""),
    term: params.get("utm_term") || "",
    content: params.get("utm_content") || "",
    landing_path: landingPath,
    referrer,
  });
  if (navigator.sendBeacon && navigator.sendBeacon("/api/public/utm-visit", new Blob([body], { type: "application/json" }))) {
    return;
  }
  void fetch("/api/public/utm-visit", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}

export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const hasCampaign = UTM_KEYS.some((key) => params.has(key));
    const referrer = document.referrer && !document.referrer.includes(window.location.host) ? document.referrer : "";
    if (!hasCampaign && !referrer) return;

    const refCode = sanitizeRefCode(params.get("ref"));
    const hasUTMSource = Boolean(params.get("utm_source") || params.get("gclid") || params.get("fbclid"));
    const current = readCookie();
    const next = {
      attribution_id: current?.attribution_id || crypto.randomUUID?.() || `${Date.now()}`,
      touch_type: "last",
      source: params.get("utm_source") || params.get("gclid") || params.get("fbclid") || (refCode ? "ref" : "") || current?.source || (referrer ? "referral" : ""),
      medium: params.get("utm_medium") || (refCode && !hasUTMSource ? "partner" : "") || current?.medium || (referrer ? "referral" : ""),
      campaign: params.get("utm_campaign") || (refCode && !hasUTMSource ? refCode : "") || current?.campaign || "",
      term: params.get("utm_term") || current?.term || "",
      content: params.get("utm_content") || current?.content || "",
      landing_path: current?.landing_path || `${pathname}${window.location.search}`,
      referrer: current?.referrer || referrer,
      ref_code: refCode || current?.ref_code || "",
    };
    writeCookie(next);
    reportVisit(params, next.attribution_id, `${pathname}${window.location.search}`, referrer);
  }, [pathname, searchParams]);

  return null;
}
