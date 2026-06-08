import { afterEach, describe, expect, it } from "vitest";

import { robotsBody } from "@/app/robots.txt/route";
import {
  documentationEntries,
  isNonSelfCanonical,
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
    expect(body).toContain("Content-Signal: search=yes, ai-input=yes, ai-train=yes");
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
      "x-default": "https://example.com/en",
    });

    const xml = renderSitemap(entries);
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).not.toContain("<priority>");
    expect(xml).not.toContain("<changefreq>");
    expect(xml).not.toContain("<lastmod>");
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
    expect(introduction?.lastModified).toBeUndefined();
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

  it("escapes sitemap values and creates a valid sitemap index", () => {
    const sitemap = renderSitemap([{ url: "https://example.com/a?x=1&y=2" }]);
    expect(sitemap).toContain("x=1&amp;y=2");

    const index = renderSitemapIndex([
      { url: "https://example.com/sitemaps/pages.xml" },
    ]);
    expect(index).toContain("<sitemapindex");
    expect(index).toContain("<loc>https://example.com/sitemaps/pages.xml</loc>");
  });
});
