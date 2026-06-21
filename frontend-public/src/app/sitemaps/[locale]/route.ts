import { publicSiteUrl } from "@/lib/seo";

export const revalidate = 3600;
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: legacyFile } = await params;
  const target = legacyFile === "pages.xml" || legacyFile === "docs.xml"
    ? `/sitemaps/en/${legacyFile}`
    : /^blog-\d+\.xml$/.test(legacyFile)
      ? `/sitemaps/en/${legacyFile}`
      : null;
  if (!target) return new Response("Not found", { status: 404 });
  return Response.redirect(`${publicSiteUrl()}${target}`, 308);
}
