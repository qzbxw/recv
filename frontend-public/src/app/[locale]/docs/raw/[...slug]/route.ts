import { NextRequest, NextResponse } from "next/server";
import { getDocBySlug } from "@/lib/docs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; slug: string[] }> }
) {
  const { locale, slug } = await params;
  if (locale !== "ru" && locale !== "en") {
    return NextResponse.redirect(new URL(`/en/docs/raw/${slug.join("/")}`, request.url), 308);
  }
  
  try {
    const doc = getDocBySlug(slug, locale);
    
    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }

    // Return the raw markdown content
    return new Response(doc.content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("Failed to fetch raw doc:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
