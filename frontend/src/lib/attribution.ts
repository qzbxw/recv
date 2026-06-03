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
};

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
