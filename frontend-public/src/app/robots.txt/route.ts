import { publicSiteUrl } from "@/lib/seo";

export function robotsBody() {
  const baseUrl = publicSiteUrl();
  return `User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /app/
Disallow: /api/
Disallow: /v1/
Disallow: /internal/

User-agent: ClaudeBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Amazonbot
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

export async function GET() {
  return new Response(robotsBody(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
