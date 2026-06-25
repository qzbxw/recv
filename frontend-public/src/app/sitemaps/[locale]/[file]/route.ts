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
import { FALLBACK_BLOG_POSTS } from "@/lib/blog-articles";
import { LOCALES, type Locale } from "@/i18n";

type SitemapLocale = "en" | "ru";

type BlogSitemapItem = {
  slug: string;
  locale: SitemapLocale;
  canonical_url?: string | null;
  updated_at: string;
  available_locales?: SitemapLocale[];
};

type BlogSitemapResponse = {
  items?: BlogSitemapItem[];
};

export const revalidate = 3600;
export const runtime = "nodejs";

function fallbackBlogEntries(locale: SitemapLocale, page: number) {
  const baseUrl = publicSiteUrl();
  const start = (page - 1) * SITEMAP_PAGE_SIZE;
  return FALLBACK_BLOG_POSTS[locale]
    .slice(start, start + SITEMAP_PAGE_SIZE)
    .map((post) => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: post.updated_at || post.published_at,
      alternates: {
        en: `${baseUrl}/en/blog/${post.slug}`,
        ru: `${baseUrl}/ru/blog/${post.slug}`,
        "x-default": `${baseUrl}/en/blog/${post.slug}`,
      },
    }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; file: string }> },
) {
  const { locale: rawLocale, file } = await params;
  if (!LOCALES.includes(rawLocale as Locale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale as Locale;

  if (file === "pages.xml") {
    return xmlResponse(renderSitemap(publicPageEntries(locale)));
  }

  if (locale !== "en" && locale !== "ru") {
    return new Response("Not found", { status: 404 });
  }
  const contentLocale: SitemapLocale = locale;

  if (file === "docs.xml") {
    return xmlResponse(renderSitemap(documentationEntries(contentLocale)));
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
      `${backendApiUrl()}/api/public/blog/sitemap?locale=${contentLocale}&page=${page}&page_size=${SITEMAP_PAGE_SIZE}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(2_000),
      },
    );
    if (!response.ok) {
      return xmlResponse(renderSitemap(fallbackBlogEntries(contentLocale, page)), 300);
    }

    const data = (await response.json()) as BlogSitemapResponse;
    const baseUrl = publicSiteUrl();
    const entries: SitemapEntry[] = (data.items ?? [])
      .filter((post) => post.locale === contentLocale)
      .filter(
        (post) =>
          !isNonSelfCanonical(
            post.canonical_url,
            `/${post.locale}/blog/${post.slug}`,
          ),
      )
      .map((post) => {
        const available = post.available_locales ?? [post.locale];
        const alternates = Object.fromEntries(
          available.map((candidate) => [
            candidate,
            `${baseUrl}/${candidate}/blog/${post.slug}`,
          ]),
        ) as SitemapEntry["alternates"];
        if (available.includes("en")) {
          alternates!["x-default"] = `${baseUrl}/en/blog/${post.slug}`;
        }
        return {
          url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
          lastModified: post.updated_at,
          alternates,
        };
      });

    return xmlResponse(renderSitemap(entries));
  } catch {
    return xmlResponse(renderSitemap(fallbackBlogEntries(contentLocale, page)), 300);
  }
}
