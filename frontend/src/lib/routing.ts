export const APP_BASE_PATH = "/app";

export function buildAppPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_BASE_PATH}${normalizedPath}`;
}

export function buildCheckoutPath(publicId: string) {
  return buildAppPath(`/checkout/${encodeURIComponent(publicId)}`);
}

export function buildCheckoutUrl(publicId: string) {
  const path = buildCheckoutPath(publicId);
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}

export function sanitizeNextPath(next: string | null | undefined) {
  if (!next) {
    return null;
  }

  const value = next.trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function buildAuthHref(nextPath: string) {
  const params = new URLSearchParams();
  params.set("next", nextPath);
  return `/auth?${params.toString()}`;
}
