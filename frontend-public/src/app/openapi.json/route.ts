import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://api:8080";
  
  try {
    const response = await fetch(`${backendUrl}/docs/doc.json`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    
    // Ensure the host is correct in the OpenAPI spec if needed
    // For now, we just proxy it
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("Failed to fetch OpenAPI spec from backend:", error);
    
    // Fallback: if backend is unreachable, we could serve a static copy or an error
    return NextResponse.json(
      { error: "OpenAPI specification currently unavailable" },
      {
        status: 503,
        headers: { "X-Robots-Tag": "noindex" },
      }
    );
  }
}
