function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || "https://reqst.xyz").replace(/\/+$/, "");
}

export async function GET() {
  const baseUrl = siteUrl();
  const updated = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Reqst Updates</title>
    <link>${baseUrl}/en/blog</link>
    <description>Reqst product, API, and crypto payments infrastructure updates.</description>
    <lastBuildDate>${updated}</lastBuildDate>
    <item>
      <title>Reqst documentation</title>
      <link>${baseUrl}/en/docs</link>
      <guid>${baseUrl}/en/docs</guid>
      <pubDate>${updated}</pubDate>
      <description>API documentation and integration guidance for Reqst.</description>
    </item>
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
