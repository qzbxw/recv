import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.[^/]+$/;
const PASSTHROUGH_PREFIXES = [
  "/_next",
  "/api",
  "/v1",
  "/app",
  "/media",
  "/og",
  "/sitemap.xml",
  "/sitemaps",
  "/robots.txt",
  "/rss.xml",
  "/llms.txt",
  "/llms-full.txt",
  "/ai-context.json",
  "/agent-actions.json",
  "/openapi.json",
];
const REDIRECT_CACHE_TTL_MS = 60_000;

type RedirectResolution = {
  targetUrl: string;
  statusCode: 301 | 302 | 308;
};

const redirectCache = new Map<
  string,
  { value: RedirectResolution | null; expiresAt: number }
>();

function requestLocale(pathname: string) {
  return pathname === "/ru" || pathname.startsWith("/ru/") ? "ru" : "en";
}

function isPassthrough(pathname: string) {
  return (
    PUBLIC_FILE.test(pathname) ||
    PASSTHROUGH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

async function resolveManagedRedirect(pathname: string) {
  const cached = redirectCache.get(pathname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let value: RedirectResolution | null = null;
  try {
    const backendUrl = (
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://api:8080"
    ).replace(/\/+$/, "");
    const response = await fetch(
      `${backendUrl}/api/public/seo/redirect?path=${encodeURIComponent(pathname)}`,
      {
        signal: AbortSignal.timeout(250),
        cache: "no-store",
      },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        target_url?: string;
        status_code?: number;
      };
      if (
        data.target_url &&
        (data.status_code === 301 ||
          data.status_code === 302 ||
          data.status_code === 308)
      ) {
        value = {
          targetUrl: data.target_url,
          statusCode: data.status_code,
        };
      }
    }
  } catch {
    value = null;
  }

  redirectCache.set(pathname, {
    value,
    expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS,
  });
  return value;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  let pathname = url.pathname;

  if (pathname.endsWith("/index.html")) {
    pathname = pathname.slice(0, -"/index.html".length) || "/";
  } else if (pathname !== "/" && pathname.endsWith("/")) {
    pathname = pathname.replace(/\/+$/, "");
  }

  if (pathname !== url.pathname) {
    const target = new URL(request.url);
    target.pathname = pathname;
    return NextResponse.redirect(target, 308);
  }

  if (pathname === "/") {
    url.pathname = "/en";
    return NextResponse.redirect(url, 308);
  }

  if (!isPassthrough(pathname) && !/^\/(en|ru)(?:\/|$)/.test(pathname)) {
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  if (!isPassthrough(pathname)) {
    const managedRedirect = await resolveManagedRedirect(pathname);
    if (managedRedirect) {
      const target = new URL(managedRedirect.targetUrl, request.nextUrl.origin);
      if (!target.search && url.search) {
        target.search = url.search;
      }
      return NextResponse.redirect(target, managedRedirect.statusCode);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-recv-locale", requestLocale(pathname));
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!favicon.ico|icon.png|apple-icon.png).*)",
    "/",
  ],
};
