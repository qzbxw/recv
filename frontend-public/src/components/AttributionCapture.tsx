"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const COOKIE_NAME = "recv_attr";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

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

export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const hasCampaign = UTM_KEYS.some((key) => params.has(key));
    const referrer = document.referrer && !document.referrer.includes(window.location.host) ? document.referrer : "";
    if (!hasCampaign && !referrer) return;

    const current = readCookie();
    const next = {
      attribution_id: current?.attribution_id || crypto.randomUUID?.() || `${Date.now()}`,
      touch_type: "last",
      source: params.get("utm_source") || params.get("gclid") || params.get("fbclid") || current?.source || (referrer ? "referral" : ""),
      medium: params.get("utm_medium") || current?.medium || (referrer ? "referral" : ""),
      campaign: params.get("utm_campaign") || current?.campaign || "",
      term: params.get("utm_term") || current?.term || "",
      content: params.get("utm_content") || current?.content || "",
      landing_path: current?.landing_path || `${pathname}${window.location.search}`,
      referrer: current?.referrer || referrer,
    };
    writeCookie(next);
  }, [pathname, searchParams]);

  return null;
}
