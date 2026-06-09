import { backendApiUrl } from "@/lib/seo";
import { isNonSelfCanonical } from "@/lib/seo";

export type PublicBlogPost = {
  slug: string;
  title: string;
  content_md: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  author?: string | null;
  canonical_url?: string | null;
  locale: "en" | "ru";
  published_at: string;
  updated_at?: string | null;
  available_locales?: string[] | null;
};

export async function getPublishedBlogPosts(locale: "en" | "ru", pageSize = 100) {
  try {
    const response = await fetch(
      `${backendApiUrl()}/api/public/blog?locale=${locale}&page_size=${pageSize}`,
      {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(2_000),
      },
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { items?: PublicBlogPost[] };
    return (data.items ?? []).filter(
      (post) =>
        !isNonSelfCanonical(
          post.canonical_url,
          `/${locale}/blog/${post.slug}`,
        ),
    );
  } catch {
    return [];
  }
}

export async function getPublishedBlogPost(
  slug: string,
  locale: "en" | "ru",
) {
  try {
    const response = await fetch(
      `${backendApiUrl()}/api/public/blog/${encodeURIComponent(slug)}?locale=${locale}`,
      {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(2_000),
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as PublicBlogPost;
  } catch {
    return null;
  }
}
