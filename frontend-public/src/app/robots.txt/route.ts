import { backendApiUrl, publicSiteUrl, robotsBody } from "@/lib/seo";

export async function GET() {
  let body = robotsBody();
  try {
    const response = await fetch(`${backendApiUrl()}/api/public/seo/robots`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(2_000),
    });
    if (response.ok) {
      const data = (await response.json()) as { content?: string };
      if (data.content?.includes(`Sitemap: ${publicSiteUrl()}/sitemap.xml`)) {
        body = data.content;
      }
    }
  } catch {
    // Keep the safe static fallback when the API is unavailable.
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
