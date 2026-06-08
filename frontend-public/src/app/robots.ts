import { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/api/", "/v1/", "/internal/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
