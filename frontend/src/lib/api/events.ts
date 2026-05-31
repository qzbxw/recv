import { getApiBase, request } from "./core";

type ProductEventPayload = {
  event_name: string;
  source?: string;
  invoice_public_id?: string;
  properties?: Record<string, unknown>;
};

export function trackPublicEvent(payload: ProductEventPayload) {
  const body = JSON.stringify({ ...payload, properties: payload.properties || {} });
  const url = `${getApiBase()}/api/public/events`;
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export async function trackEvent(token: string, payload: ProductEventPayload) {
  return request<void>("/api/events", {
    method: "POST",
    body: JSON.stringify({ ...payload, properties: payload.properties || {} }),
  }, token);
}
