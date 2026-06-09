import { ogCardResponse, OG_TITLE_MAX, OG_KICKER_MAX } from "@/lib/og-card";

export const dynamic = "force-dynamic";

// Per-URL social card generator. Pages reference it from their metadata via
// socialImages(); parameters are tightly bounded so the endpoint cannot be
// used as a general-purpose image service.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const title = (params.get("title") ?? "").replace(/\s+/g, " ").trim();
  if (!title || title.length > OG_TITLE_MAX) {
    return new Response("Invalid title", { status: 400 });
  }

  const kicker = (params.get("kicker") ?? "").replace(/\s+/g, " ").trim();
  if (kicker.length > OG_KICKER_MAX) {
    return new Response("Invalid kicker", { status: 400 });
  }

  const locale = params.get("locale") === "ru" ? "ru" : "en";

  const image = ogCardResponse({ title, kicker: kicker || undefined, locale });
  image.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  return image;
}
