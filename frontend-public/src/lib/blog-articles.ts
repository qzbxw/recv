import articleSource from "../../content/blog/articles.json";
import type { PublicBlogPost } from "@/lib/blog";

type ArticleSource = {
  slug: string;
  locale: "en" | "ru";
  title: string;
  excerpt: string;
  meta_description: string;
  published_at: string;
  tags: string[];
  sections: [string, string][];
};

const articles = articleSource as ArticleSource[];

export const FALLBACK_BLOG_POSTS: Record<"en" | "ru", PublicBlogPost[]> = {
  en: [],
  ru: [],
};

for (const article of articles) {
  FALLBACK_BLOG_POSTS[article.locale].push({
    slug: article.slug,
    title: article.title,
    h1: article.title,
    excerpt: article.excerpt,
    meta_title: article.title,
    meta_description: article.meta_description,
    og_title: article.title,
    og_description: article.meta_description,
    author: "Recv Core Team",
    author_slug: "recv-core",
    locale: article.locale,
    content_md: article.sections
      .map(([heading, body]) => `## ${heading}\n\n${body}`)
      .join("\n\n"),
    content_version: 1,
    cover_image_url: null,
    canonical_url: null,
    robots_index: true,
    robots_follow: true,
    include_in_sitemap: true,
    published_at: article.published_at,
    updated_at: article.published_at,
    available_locales: ["en", "ru"],
  });
}

for (const locale of ["en", "ru"] as const) {
  FALLBACK_BLOG_POSTS[locale].sort(
    (a, b) => Date.parse(b.published_at) - Date.parse(a.published_at),
  );
}

export function fallbackBlogPost(slug: string, locale: "en" | "ru") {
  return FALLBACK_BLOG_POSTS[locale].find((post) => post.slug === slug) ?? null;
}
