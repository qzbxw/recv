import fs from "fs";
import path from "path";

import { LOCALES, type Locale } from "@/i18n";
import { getAllDocSlugs } from "@/lib/docs";

export const SITE_NAME = "recv";
export const DEFAULT_SITE_URL = "https://recv.money";
export const SITEMAP_PAGE_SIZE = 50_000;
const DESCRIPTION_MIN_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 160;

export const PUBLIC_ROUTES = [
  "",
  "/dev",
  "/merchant",
  "/business",
  "/security",
  "/about",
  "/contact",
  "/integrations",
  "/customers",
  "/changelog",
  "/help",
  "/privacy",
  "/terms",
  "/blog",
  "/blog/author/recv-core",
  "/status",
  "/pricing",
  "/products",
  "/products/checkout",
  "/products/invoicing",
  "/products/api",
  "/products/mcp",
  "/networks",
  "/networks/ton",
  "/networks/ton_usdt",
  "/networks/tron",
  "/networks/solana",
  "/networks/base",
  "/networks/arbitrum",
  "/networks/bsc",
  "/use-cases",
  "/use-cases/telegram-shops",
  "/use-cases/saas-billing",
  "/use-cases/digital-goods",
  "/use-cases/paid-communities",
  "/compare",
  "/compare/nowpayments",
  "/compare/recv-vs-manual",
  "/compare/recv-vs-custodial",
  "/compare/coinbase-commerce",
  "/compare/bitpay",
  "/compare/coingate",
  "/compare/cryptomus",
] as const;

export function publicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PUBLIC_APP_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/+$/, "");
}

export function robotsBody() {
  return `# Content signals (search, AI input, AI training) are all allowed.
User-agent: *
Allow: /
Disallow: /app/
Disallow: /api/
Disallow: /v1/
Disallow: /internal/

User-agent: ClaudeBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Amazonbot
Allow: /

Sitemap: ${publicSiteUrl()}/sitemap.xml
`;
}

export function backendApiUrl() {
  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://api:8080"
  ).replace(/\/+$/, "");
}

export function localizedUrl(locale: Locale, route = "") {
  return `${publicSiteUrl()}/${locale}${route}`;
}

// Per-URL 1200×630 social card rendered by /og. Returned entries are used
// for both openGraph.images and twitter.images; metadataBase makes the
// relative URL absolute in the emitted tags.
export function socialImages(locale: string, title: string, kicker?: string) {
  const params = new URLSearchParams({ locale: locale === "ru" ? "ru" : "en", title: title.replace(/\s+/g, " ").trim().slice(0, 90) });
  const trimmedKicker = kicker?.replace(/\s+/g, " ").trim().slice(0, 48);
  if (trimmedKicker) params.set("kicker", trimmedKicker);
  return [
    {
      url: `/og?${params.toString()}`,
      width: 1200,
      height: 630,
      alt: title,
    },
  ];
}

export function languageAlternates(route = "") {
  return {
    en: `/en${route}`,
    ru: `/ru${route}`,
    "x-default": `/en${route}`,
  };
}

export function metadataDescription(
  locale: Locale,
  value: string,
  fallback?: string,
) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length >= DESCRIPTION_MIN_LENGTH && normalized.length <= DESCRIPTION_MAX_LENGTH) {
    return normalized;
  }

  const suffix = fallback?.trim() || (locale === "ru"
    ? "Узнайте, как recv помогает принимать криптоплатежи напрямую на ваши кошельки, автоматизировать checkout и отслеживать статусы."
    : "Learn how recv helps you accept crypto payments directly to your wallets, automate checkout, and track payment status.");
  const combined = `${normalized.replace(/[.!?]+$/, "")}. ${suffix}`.replace(/\s+/g, " ").trim();
  if (combined.length <= DESCRIPTION_MAX_LENGTH) {
    return combined;
  }

  const candidate = combined.slice(0, DESCRIPTION_MAX_LENGTH);
  const boundary = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, boundary > DESCRIPTION_MIN_LENGTH ? boundary : DESCRIPTION_MAX_LENGTH - 1).replace(/[,:;.\s]+$/, "")}.`;
}

export function isNonSelfCanonical(
  canonicalUrl: string | null | undefined,
  selfPath: string,
) {
  if (!canonicalUrl) return false;
  try {
    const canonical = new URL(canonicalUrl, publicSiteUrl());
    const self = new URL(selfPath, publicSiteUrl());
    return (
      canonical.origin !== self.origin ||
      canonical.pathname.replace(/\/+$/, "") !== self.pathname.replace(/\/+$/, "")
    );
  } catch {
    return true;
  }
}

export type SitemapEntry = {
  url: string;
  lastModified?: string;
  alternates?: Partial<Record<Locale | "x-default", string>>;
};

function frontendRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "src", "app"))) return cwd;

  const nested = path.join(cwd, "frontend-public");
  if (fs.existsSync(path.join(nested, "src", "app"))) return nested;

  return cwd;
}

function newestMtimeIso(paths: string[]) {
  const configured = process.env.SITE_LASTMOD || process.env.NEXT_PUBLIC_SITE_LASTMOD;
  if (configured) {
    const date = new Date(configured);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  let newest = 0;
  for (const candidate of paths) {
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile()) newest = Math.max(newest, stat.mtimeMs);
    } catch {
      // Optional source files are not always present in Next standalone output.
    }
  }

  return newest ? new Date(newest).toISOString() : undefined;
}

function publicRouteSourcePaths(locale: Locale, route: string) {
  const root = frontendRoot();
  const routeParts = route.split("/").filter(Boolean);
  const pagePath = (...parts: string[]) =>
    path.join(root, "src", "app", "[locale]", ...parts, "page.tsx");
  const candidates = [
    path.join(root, "src", "i18n", `${locale}.ts`),
    path.join(root, "src", "i18n", "index.ts"),
    path.join(root, "package.json"),
  ];

  if (route === "") return [pagePath(), ...candidates];
  if (routeParts[0] === "networks" && routeParts.length === 2) {
    return [pagePath("networks", "[network]"), ...candidates];
  }
  if (routeParts[0] === "use-cases" && routeParts.length === 2) {
    return [pagePath("use-cases", "[usecase]"), ...candidates];
  }
  if (routeParts[0] === "compare" && routeParts.length === 2) {
    return [pagePath("compare", "[competitor]"), ...candidates];
  }

  return [pagePath(...routeParts), ...candidates];
}

export function publicPageEntries(locale?: Locale): SitemapEntry[] {
  const baseUrl = publicSiteUrl();
  const locales = locale ? [locale] : LOCALES;

  return locales.flatMap((entryLocale) =>
    PUBLIC_ROUTES.map((route) => ({
      url: `${baseUrl}/${entryLocale}${route}`,
      lastModified: newestMtimeIso(publicRouteSourcePaths(entryLocale, route)),
      alternates: {
        en: `${baseUrl}/en${route}`,
        ru: `${baseUrl}/ru${route}`,
        "x-default": `${baseUrl}/en${route}`,
      },
    })),
  );
}

export function documentationEntries(locale?: Locale): SitemapEntry[] {
  const baseUrl = publicSiteUrl();
  const locales = locale ? [locale] : LOCALES;
  const root = frontendRoot();

  return locales.flatMap((entryLocale) =>
    getAllDocSlugs(entryLocale).map((slug) => {
      const route = `/docs/${slug.join("/")}`;
      const docPath = path.join(root, "content", "docs", entryLocale, ...slug) + ".mdx";
      const translatedLocales = LOCALES.filter((candidate) =>
        fs.existsSync(
          path.join(
            root,
            "content",
            "docs",
            candidate,
            ...slug,
          ) + ".mdx",
        ),
      );
      const alternates = Object.fromEntries(
        translatedLocales.map((candidate) => [
          candidate,
          `${baseUrl}/${candidate}${route}`,
        ]),
      ) as SitemapEntry["alternates"];

      if (translatedLocales.includes("en")) {
        alternates!["x-default"] = `${baseUrl}/en${route}`;
      }

      return {
        url: `${baseUrl}/${entryLocale}${route}`,
        lastModified: newestMtimeIso([
          docPath,
          path.join(root, "src", "app", "[locale]", "docs", "[...slug]", "page.tsx"),
          path.join(root, "src", "i18n", `${entryLocale}.ts`),
          path.join(root, "package.json"),
        ]),
        alternates,
      };
    }),
  );
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderSitemap(entries: SitemapEntry[]) {
  const urls = entries
    .map((entry) => {
      const alternates = Object.entries(entry.alternates ?? {})
        .map(
          ([locale, href]) =>
            `    <xhtml:link rel="alternate" hreflang="${xmlEscape(locale)}" href="${xmlEscape(href)}" />`,
        )
        .join("\n");
      return [
        "  <url>",
        `    <loc>${xmlEscape(entry.url)}</loc>`,
        entry.lastModified
          ? `    <lastmod>${xmlEscape(entry.lastModified)}</lastmod>`
          : "",
        alternates,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

export function renderSitemapIndex(
  sitemaps: Array<{ url: string; lastModified?: string }>,
) {
  const items = sitemaps
    .map((sitemap) =>
      [
        "  <sitemap>",
        `    <loc>${xmlEscape(sitemap.url)}</loc>`,
        sitemap.lastModified
          ? `    <lastmod>${xmlEscape(sitemap.lastModified)}</lastmod>`
          : "",
        "  </sitemap>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

export function xmlResponse(body: string, cacheSeconds = 3600) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
    },
  });
}

export function textResponse(body: string, contentType = "text/plain") {
  return new Response(body, {
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
