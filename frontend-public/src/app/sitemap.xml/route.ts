import {
  backendApiUrl,
  documentationEntries,
  newestSitemapLastModified,
  publicPageEntries,
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
export const runtime = "nodejs";

export async function GET() {
  const baseUrl = publicSiteUrl();
  const sitemaps: Array<{ url: string; lastModified?: string }> = [];

  for (const locale of ["en", "ru"] as const) {
    const pageEntries = publicPageEntries(locale);
    const docEntries = documentationEntries(locale);
    const fallbackBlogPages = Math.ceil(FALLBACK_BLOG_POSTS[locale].length / SITEMAP_PAGE_SIZE);
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
      blogPages = fallbackBlogPages;
      blogLastModified = FALLBACK_BLOG_POSTS[locale][0]?.updated_at || undefined;
    }

    if (blogPages === 0 && fallbackBlogPages > 0) {
      blogPages = fallbackBlogPages;
      blogLastModified = blogLastModified || FALLBACK_BLOG_POSTS[locale][0]?.updated_at || undefined;
    }

    sitemaps.push(
      {
        url: `${baseUrl}/sitemaps/${locale}/pages.xml`,
        lastModified: newestSitemapLastModified(pageEntries),
      },
      {
        url: `${baseUrl}/sitemaps/${locale}/docs.xml`,
        lastModified: newestSitemapLastModified(docEntries),
      },
      ...Array.from({ length: blogPages }, (_, index) => ({
        url: `${baseUrl}/sitemaps/${locale}/blog-${index + 1}.xml`,
        lastModified: blogLastModified,
      })),
    );
  }

  return xmlResponse(renderSitemapIndex(sitemaps));
}
