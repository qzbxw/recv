import { getPublishedBlogPosts } from "@/lib/blog";
import { renderBlogRss, rssResponse } from "@/lib/rss";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ru") {
    return new Response("Not found", { status: 404 });
  }

  return rssResponse(
    renderBlogRss(locale, await getPublishedBlogPosts(locale)),
  );
}
