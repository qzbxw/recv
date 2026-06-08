import fs from "fs";
import path from "path";

import { LOCALES, type Locale } from "@/i18n";
import { getAllDocSlugs } from "@/lib/docs";

export const SITE_NAME = "recv";
export const DEFAULT_SITE_URL = "https://recv.money";
export const SITEMAP_PAGE_SIZE = 50_000;

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
] as const;

export function publicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PUBLIC_APP_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/+$/, "");
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

export function languageAlternates(route = "") {
  return {
    en: `/en${route}`,
    ru: `/ru${route}`,
    "x-default": `/en${route}`,
  };
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

export function publicPageEntries(): SitemapEntry[] {
  const baseUrl = publicSiteUrl();

  return LOCALES.flatMap((locale) =>
    PUBLIC_ROUTES.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      alternates: {
        en: `${baseUrl}/en${route}`,
        ru: `${baseUrl}/ru${route}`,
        "x-default": `${baseUrl}/en${route}`,
      },
    })),
  );
}

export function documentationEntries(): SitemapEntry[] {
  const baseUrl = publicSiteUrl();

  return LOCALES.flatMap((locale) =>
    getAllDocSlugs(locale).map((slug) => {
      const route = `/docs/${slug.join("/")}`;
      const translatedLocales = LOCALES.filter((candidate) =>
        fs.existsSync(
          path.join(
            process.cwd(),
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
        url: `${baseUrl}/${locale}${route}`,
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
