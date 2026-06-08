import {
  backendApiUrl,
  documentationEntries,
  isNonSelfCanonical,
  publicPageEntries,
  publicSiteUrl,
  renderSitemap,
  SITEMAP_PAGE_SIZE,
  type SitemapEntry,
  xmlResponse,
} from "@/lib/seo";

type BlogSitemapItem = {
  slug: string;
  locale: "en" | "ru";
  canonical_url?: string | null;
  updated_at: string;
};

type BlogSitemapResponse = {
  items?: BlogSitemapItem[];
};

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  if (file === "pages.xml") {
    return xmlResponse(renderSitemap(publicPageEntries()));
  }

  if (file === "docs.xml") {
    return xmlResponse(renderSitemap(documentationEntries()));
  }

  const blogMatch = /^blog-(\d+)\.xml$/.exec(file);
  if (!blogMatch) {
    return new Response("Not found", { status: 404 });
  }

  const page = Number(blogMatch[1]);
  if (!Number.isSafeInteger(page) || page < 1) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const response = await fetch(
      `${backendApiUrl()}/api/public/blog/sitemap?page=${page}&page_size=${SITEMAP_PAGE_SIZE}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2_000),
      },
    );
    if (!response.ok) {
      return xmlResponse(renderSitemap([]), 300);
    }

    const data = (await response.json()) as BlogSitemapResponse;
    const baseUrl = publicSiteUrl();
    const entries: SitemapEntry[] = (data.items ?? [])
      .filter((post) => post.locale === "en" || post.locale === "ru")
      .filter(
        (post) =>
          !isNonSelfCanonical(
            post.canonical_url,
            `/${post.locale}/blog/${post.slug}`,
          ),
      )
      .map((post) => ({
        url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
        lastModified: post.updated_at,
      }));

    return xmlResponse(renderSitemap(entries));
  } catch {
    return xmlResponse(renderSitemap([]), 300);
  }
}
