import { getPublishedBlogPosts } from "@/lib/blog";
import { renderBlogRss, rssResponse } from "@/lib/rss";

export async function GET() {
  return rssResponse(renderBlogRss("en", await getPublishedBlogPosts("en")));
}
