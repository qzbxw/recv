import { NextRequest } from "next/server";
import { getDocBySlug } from "@/lib/docs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; slug: string[] }> }
) {
  const { locale, slug } = await params;
  
  try {
    const doc = getDocBySlug(slug, locale);
    
    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }

    // Return the raw markdown content
    return new Response(doc.content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Failed to fetch raw doc:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
