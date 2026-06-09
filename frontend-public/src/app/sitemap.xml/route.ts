import {
  backendApiUrl,
  publicSiteUrl,
  renderSitemapIndex,
  SITEMAP_PAGE_SIZE,
  xmlResponse,
} from "@/lib/seo";
import { FALLBACK_BLOG_POSTS } from "@/lib/blog-articles";

type BlogSitemapResponse = {
  total?: number;
  updated_at?: string;
};

export const revalidate = 3600;

export async function GET() {
  const baseUrl = publicSiteUrl();
  const sitemaps: Array<{ url: string; lastModified?: string }> = [];

  for (const locale of ["en", "ru"] as const) {
    let blogPages = 0;
    let blogLastModified: string | undefined;

    try {
      const response = await fetch(
        `${backendApiUrl()}/api/public/blog/sitemap?locale=${locale}&page=1&page_size=1`,
        {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(2_000),
        },
      );
      if (response.ok) {
        const data = (await response.json()) as BlogSitemapResponse;
        blogPages = Math.ceil((data.total ?? 0) / SITEMAP_PAGE_SIZE);
        blogLastModified = data.updated_at;
      }
    } catch {
      blogPages = Math.ceil(FALLBACK_BLOG_POSTS[locale].length / SITEMAP_PAGE_SIZE);
      blogLastModified = FALLBACK_BLOG_POSTS[locale][0]?.updated_at || undefined;
    }

    sitemaps.push(
      { url: `${baseUrl}/sitemaps/${locale}/pages.xml` },
      { url: `${baseUrl}/sitemaps/${locale}/docs.xml` },
      ...Array.from({ length: blogPages }, (_, index) => ({
        url: `${baseUrl}/sitemaps/${locale}/blog-${index + 1}.xml`,
        lastModified: blogLastModified,
      })),
    );
  }

  return xmlResponse(renderSitemapIndex(sitemaps));
}
