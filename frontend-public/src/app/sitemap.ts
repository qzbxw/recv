import { MetadataRoute } from "next";
import { getAllDocSlugs } from "@/lib/docs";

export const revalidate = 3600;

function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || "https://recv.money").replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = publicSiteUrl();
  const locales = ["en", "ru"];

  const staticRoutes = [
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
    "/networks/base",
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
  ];

  const routes: MetadataRoute.Sitemap = locales.flatMap((locale) => 
    staticRoutes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1.0 : 0.8,
    }))
  );

  // Docs
  const docRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => {
    const slugs = getAllDocSlugs(locale);
    return slugs.map((slug) => ({
      url: `${baseUrl}/${locale}/docs/${slug.join("/")}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  });

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://api:8080";
    const res = await fetch(`${apiBase}/api/public/blog`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        blogRoutes = locales.flatMap((locale) => 
          data.items.map((post: { slug: string; updated_at: string }) => ({
            url: `${baseUrl}/${locale}/blog/${post.slug}`,
            lastModified: new Date(post.updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          }))
        );
      }
    }
  } catch {
    blogRoutes = [];
  }

  return [...routes, ...docRoutes, ...blogRoutes];
}
