import { backendApiUrl } from "@/lib/seo";

const MEDIA_FILE_PATTERN = /^[a-f0-9]{16}\.(jpg|png|webp|gif)$/;

// Streams CMS media from the backend so next/image can optimize relative
// /media URLs and public visitors get the same content-addressed files.
export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  if (!MEDIA_FILE_PATTERN.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${backendApiUrl()}/media/${file}`, {
      cache: "force-cache",
      next: { revalidate: 31_536_000 },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return new Response("Media unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      // File names are content hashes; bodies never change for a given name.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
