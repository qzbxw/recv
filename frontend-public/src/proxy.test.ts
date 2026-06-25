import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("managed redirect proxy", () => {
  it("redirects the root to English with 308", async () => {
    const response = await proxy(new NextRequest("https://recv.money/"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://recv.money/en");
  });

  it("localizes a public path and preserves its query", async () => {
    const response = await proxy(
      new NextRequest("https://recv.money/products?utm_source=partner"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://recv.money/en/products?utm_source=partner",
    );
  });

  it("removes trailing slashes and index.html with 308", async () => {
    const trailing = await proxy(
      new NextRequest("https://recv.money/en/products/?ref=docs"),
    );
    const index = await proxy(
      new NextRequest("https://recv.money/ru/docs/index.html?q=api"),
    );

    expect(trailing.status).toBe(308);
    expect(trailing.headers.get("location")).toBe(
      "https://recv.money/en/products?ref=docs",
    );
    expect(index.status).toBe(308);
    expect(index.headers.get("location")).toBe(
      "https://recv.money/ru/docs?q=api",
    );
  });

  it("passes service routes through without locale redirects", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    for (const path of [
      "/api/public/blog",
      "/v1/invoices",
      "/app/auth",
      "/media/0011223344556677.jpg",
      "/sitemap.xml",
      "/robots.txt",
      "/openapi.json",
    ]) {
      const response = await proxy(new NextRequest(`https://recv.money${path}`));
      expect(response.status, path).toBe(200);
      expect(response.headers.get("location"), path).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects docs and blog from non-content locales to English", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    for (const [source, target] of [
      ["/uk/docs/introduction", "/en/docs/introduction"],
      ["/uz/blog", "/en/blog"],
      ["/de/blog/trc20-payment-api", "/en/blog/trc20-payment-api"],
    ]) {
      const response = await proxy(
        new NextRequest(`https://recv.money${source}?utm_source=partner`),
      );

      expect(response.status, source).toBe(308);
      expect(response.headers.get("location"), source).toBe(
        `https://recv.money${target}?utm_source=partner`,
      );
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the OG image generator through without locale redirects", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxy(
      new NextRequest("https://recv.money/og?locale=ru&title=Test"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves attribution query parameters for a managed redirect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      Response.json({ target_url: "/en/new-page", status_code: 308 }),
    ));

    const response = await proxy(
      new NextRequest("https://recv.money/en/old-page?utm_source=partner"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://recv.money/en/new-page?utm_source=partner",
    );
  });

  it("uses a target query instead of copying the source query", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      Response.json({ target_url: "/en/new-page?ref=managed", status_code: 302 }),
    ));

    const response = await proxy(
      new NextRequest("https://recv.money/en/temporary?utm_source=partner"),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://recv.money/en/new-page?ref=managed",
    );
  });
});
