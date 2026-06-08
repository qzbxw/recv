import {
  backendApiUrl,
  publicSiteUrl,
  renderSitemapIndex,
  SITEMAP_PAGE_SIZE,
  xmlResponse,
} from "@/lib/seo";

type BlogSitemapResponse = {
  total?: number;
  updated_at?: string;
};

export const revalidate = 3600;

export async function GET() {
  const baseUrl = publicSiteUrl();
  let blogPages = 0;
  let blogLastModified: string | undefined;

  try {
    const response = await fetch(
      `${backendApiUrl()}/api/public/blog/sitemap?page=1&page_size=1`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2_000),
      },
    );
    if (response.ok) {
      const data = (await response.json()) as BlogSitemapResponse;
      blogPages = Math.max(1, Math.ceil((data.total ?? 0) / SITEMAP_PAGE_SIZE));
      blogLastModified = data.updated_at;
    }
  } catch {
    blogPages = 1;
  }

  const sitemaps = [
    { url: `${baseUrl}/sitemaps/pages.xml` },
    { url: `${baseUrl}/sitemaps/docs.xml` },
    ...Array.from({ length: blogPages }, (_, index) => ({
      url: `${baseUrl}/sitemaps/blog-${index + 1}.xml`,
      lastModified: blogLastModified,
    })),
  ];

  return xmlResponse(renderSitemapIndex(sitemaps));
}
