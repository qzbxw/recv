import { backendApiUrl } from "@/lib/seo";
import { isNonSelfCanonical } from "@/lib/seo";

export type PublicBlogPost = {
  slug: string;
  title: string;
  h1?: string | null;
  content_md: string;
  content_json?: Record<string, unknown> | null;
  content_version?: number;
  excerpt?: string | null;
  cover_image_url?: string | null;
  cover_image_width?: number;
  cover_image_height?: number;
  author?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  cover_image_alt?: string | null;
  robots_index?: boolean;
  robots_follow?: boolean;
  include_in_sitemap?: boolean;
  author_slug?: string | null;
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
