import type { PublicBlogPost } from "@/lib/blog";
import { publicSiteUrl } from "@/lib/seo";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderBlogRss(
  locale: "en" | "ru",
  posts: PublicBlogPost[],
) {
  const baseUrl = publicSiteUrl();
  const language = locale === "ru" ? "ru-RU" : "en-US";
  const title = locale === "ru" ? "recv: обновления" : "recv Updates";
  const description =
    locale === "ru"
      ? "Продуктовые и технические материалы recv о криптоплатежах."
      : "recv product, API, and crypto payments infrastructure updates.";
  const items = posts
    .map((post) => {
      const url = `${baseUrl}/${locale}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt ?? "")}</description>
    </item>`;
    })
    .join("\n");
  const latest = posts[0]?.updated_at || posts[0]?.published_at;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${baseUrl}/${locale}/blog</link>
    <description>${escapeXml(description)}</description>
    <language>${language}</language>
${latest ? `    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
}

export function rssResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
