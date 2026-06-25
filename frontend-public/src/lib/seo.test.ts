import { afterEach, describe, expect, it } from "vitest";

import manifest from "@/app/manifest";
import { GET as sitemapFileGET } from "@/app/sitemaps/[locale]/[file]/route";
import { robotsBody } from "@/lib/seo";
import {
  absoluteBrandLogoUrl,
  BRAND_ICON_PATH,
  BRAND_LOGO_PATH,
  documentationEntries,
  isNonSelfCanonical,
  metadataDescription,
  newestSitemapLastModified,
  organizationJsonLd,
  PUBLIC_ROUTES,
  publicPageEntries,
  renderSitemap,
  renderSitemapIndex,
} from "@/lib/seo";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("SEO generation", () => {
  it("opens public crawling while excluding private application surfaces", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    const body = robotsBody();
    expect(body).not.toContain("Content-Signal:");
    expect(body).toContain("User-agent: ClaudeBot\nAllow: /");
    expect(body).toContain("Disallow: /app/");
    expect(body).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("renders localized public pages with reciprocal hreflang links", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const entries = publicPageEntries();
    const englishHome = entries.find((entry) => entry.url === "https://example.com/en");

    expect(englishHome?.alternates).toEqual({
      en: "https://example.com/en",
      ru: "https://example.com/ru",
      uk: "https://example.com/uk",
      uz: "https://example.com/uz",
      de: "https://example.com/de",
      "x-default": "https://example.com/en",
    });

    const xml = renderSitemap(entries);
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).not.toContain("<priority>");
    expect(xml).not.toContain("<changefreq>");
    expect(englishHome?.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(xml).toContain("<lastmod>");
    expect(PUBLIC_ROUTES).toContain("/dpa");
    expect(PUBLIC_ROUTES).toContain("/subprocessors");
    expect(entries.some((entry) => entry.url === "https://example.com/en/dpa")).toBe(true);
    expect(entries.some((entry) => entry.url === "https://example.com/ru/subprocessors")).toBe(true);
  });

  it("only links documentation translations that exist", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const entries = documentationEntries();
    const introduction = entries.find(
      (entry) => entry.url === "https://example.com/en/docs/introduction",
    );

    expect(introduction?.alternates?.ru).toBe(
      "https://example.com/ru/docs/introduction",
    );
    expect(introduction?.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("distinguishes self canonicals from canonicalized duplicates", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://recv.money";
    expect(
      isNonSelfCanonical(
        "https://recv.money/en/blog/example",
        "/en/blog/example",
      ),
    ).toBe(false);
    expect(
      isNonSelfCanonical(
        "https://publisher.example/article",
        "/en/blog/example",
      ),
    ).toBe(true);
  });

  it("normalizes metadata descriptions to the audit range", () => {
    const short = metadataDescription("en", "Short product description.");
    const long = metadataDescription("ru", "Очень длинное описание ".repeat(20));

    expect(short.length).toBeGreaterThanOrEqual(120);
    expect(short.length).toBeLessThanOrEqual(160);
    expect(long.length).toBeGreaterThanOrEqual(120);
    expect(long.length).toBeLessThanOrEqual(160);
  });

  it("uses the current site logo in structured data and the web manifest", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    const organization = organizationJsonLd("en");
    const webManifest = manifest();

    expect(absoluteBrandLogoUrl()).toBe("https://example.com/logo-transparent.png");
    expect(organization.logo).toEqual({
      "@type": "ImageObject",
      url: "https://example.com/logo-transparent.png",
      width: 500,
      height: 500,
    });
    expect(webManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: BRAND_ICON_PATH, sizes: "512x512" }),
        expect.objectContaining({ src: BRAND_LOGO_PATH, sizes: "500x500" }),
      ]),
    );
  });

  it("escapes sitemap values and creates a valid sitemap index", () => {
    const sitemap = renderSitemap([{ url: "https://example.com/a?x=1&y=2" }]);
    expect(sitemap).toContain("x=1&amp;y=2");

    const index = renderSitemapIndex([
      {
        url: "https://example.com/sitemaps/pages.xml",
        lastModified: "2026-06-21T00:00:00.000Z",
      },
    ]);
    expect(index).toContain("<sitemapindex");
    expect(index).toContain("<loc>https://example.com/sitemaps/pages.xml</loc>");
    expect(index).toContain("<lastmod>2026-06-21T00:00:00.000Z</lastmod>");
    expect(newestSitemapLastModified([
      { url: "https://example.com/old", lastModified: "2026-06-20T00:00:00.000Z" },
      { url: "https://example.com/new", lastModified: "2026-06-21T00:00:00.000Z" },
    ])).toBe("2026-06-21T00:00:00.000Z");
  });

  it("serves the English page sitemap route as crawlable XML", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
    const response = await sitemapFileGET(
      new Request("https://example.com/sitemaps/en/pages.xml"),
      { params: Promise.resolve({ locale: "en", file: "pages.xml" }) },
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(body).toContain("<urlset");
    expect(body).toContain("<loc>https://example.com/en</loc>");
    expect(body).toContain("<loc>https://example.com/en/dpa</loc>");
    expect(body).toContain("<loc>https://example.com/en/subprocessors</loc>");
    expect(body).toContain('hreflang="ru"');
  });
});
