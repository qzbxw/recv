import { MetadataRoute } from "next";

function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || "https://recv.money").replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/internal/", "/app/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
