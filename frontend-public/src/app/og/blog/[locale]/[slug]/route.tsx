import { getPublishedBlogPost } from "@/lib/blog";
import { fallbackBlogPost } from "@/lib/blog-articles";
import { ogCardResponse } from "@/lib/og-card";
import { publicSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function fallbackTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale: rawLocale, slug } = await context.params;
  const locale = rawLocale === "ru" ? "ru" : "en";
  const post = await getPublishedBlogPost(slug, locale) || fallbackBlogPost(slug, locale);
  const cover = post?.og_image_url || post?.cover_image_url;
  const coverSrc = cover
    ? new URL(cover, publicSiteUrl()).toString()
    : undefined;

  const image = ogCardResponse({
    locale,
    title: post?.og_title || post?.meta_title || post?.title || fallbackTitle(slug),
    kicker: locale === "ru" ? "Блог" : "Blog",
    coverSrc,
  });
  image.headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  );
  return image;
}
