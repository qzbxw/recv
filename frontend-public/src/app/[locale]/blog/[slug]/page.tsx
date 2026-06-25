import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { BlogPostClient } from "@/components/blog/BlogPostClient";
import { lookupPublishedBlogPost, type PublicBlogPost } from "@/lib/blog";
import { fallbackBlogPost } from "@/lib/blog-articles";
import { publisherSchema, schemaId } from "@/lib/geo";
import { isNonSelfCanonical, publicSiteUrl } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

function authorSlug(author?: string | null) {
  if (!author || author === "Recv Core Team" || author === "recv Core Team") return "recv-core";
  return author.toLowerCase().trim().replace(/\s+/g, "-");
}

// Resolves the article while keeping crawler-visible semantics honest:
// a backend 404 yields null (real 404 page), but a backend outage throws so
// the route answers 5xx instead of telling crawlers the article is gone.
async function resolveBlogPost(
  slug: string,
  language: "ru" | "en",
): Promise<PublicBlogPost | null> {
  const lookup = await lookupPublishedBlogPost(slug, language);
  const isDevOrTest = process.env.PLAYWRIGHT_TEST === "true";
  if (lookup.status === "ok") return lookup.post;
  const fallback = isDevOrTest ? fallbackBlogPost(slug, language) : null;
  if (fallback) return fallback;
  if (lookup.status === "unavailable") {
    throw new Error(`Blog backend unavailable while resolving "${slug}" (${language})`);
  }
  return null;
}

export async function generateMetadata(
  props: Props
): Promise<Metadata> {
  const params = await props.params;
  const language = params.locale === "ru" ? "ru" : "en";
  const post = await resolveBlogPost(params.slug, language);

  if (!post) {
    return { title: params.locale === "ru" ? "Материал не найден" : "Post Not Found" };
  }
  const selfPath = `/${language}/blog/${params.slug}`;
  const hasDifferentCanonical = isNonSelfCanonical(post.canonical_url, selfPath);
  const available = post.available_locales ?? [language];
  const languages = Object.fromEntries(
    available.map((locale) => [locale, `/${locale}/blog/${post.slug}`]),
  );
  if (available.includes("en")) {
    languages["x-default"] = `/en/blog/${post.slug}`;
  }
  const socialImage = `/og/blog/${language}/${post.slug}`;

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "Read the latest updates and engineering insights from recv.",
    alternates: {
      canonical: post.canonical_url || selfPath,
      languages,
    },
    robots: hasDifferentCanonical
      ? { index: false, follow: true }
      : {
          index: post.robots_index ?? true,
          follow: post.robots_follow ?? true,
        },
    openGraph: {
      type: "article",
      title: post.og_title || post.meta_title || post.title,
      description: post.og_description || post.meta_description || post.excerpt || undefined,
      url: post.canonical_url || selfPath,
      locale: language === "ru" ? "ru_RU" : "en_US",
      images: [{ url: socialImage, width: 1200, height: 630, alt: post.og_title || post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.og_title || post.meta_title || post.title,
      description: post.og_description || post.meta_description || post.excerpt || undefined,
      images: [{ url: socialImage, width: 1200, height: 630, alt: post.og_title || post.title }],
    },
  };
}

export default async function BlogPost(props: Props) {
  const params = await props.params;
  const language = params.locale === "ru" ? "ru" : "en";
  const post = await resolveBlogPost(params.slug, language);

  if (!post) {
    notFound();
  }
  const baseUrl = publicSiteUrl();
  const canonical = post.canonical_url || `${baseUrl}/${language}/blog/${post.slug}`;
  const selfPath = `/${language}/blog/${post.slug}`;
  const authorURL = `${baseUrl}/${language}/blog/author/${post.author_slug || authorSlug(post.author)}`;
  const socialImage = `${baseUrl}/og/blog/${language}/${post.slug}`;

  const blogPostSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": schemaId(selfPath, "article"),
    "headline": post.h1 || post.title,
    "description": post.meta_description || post.excerpt,
    "image": [socialImage],
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "inLanguage": language,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": post.canonical_url ? canonical : schemaId(selfPath, "webpage"),
    },
    "author": {
      "@type": "Organization",
      "name": post.author || "Recv Core Team",
      "url": authorURL,
    },
    "publisher": publisherSchema(),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": language === "ru" ? "Главная" : "Home",
        "item": `${baseUrl}/${language}`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": language === "ru" ? "Блог" : "Blog",
        "item": `${baseUrl}/${language}/blog`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": canonical,
      },
    ],
  };

  return (
    <>
      <JsonLd schema={blogPostSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <BlogPostClient key={`${language}-${post.slug}`} language={language} post={post} />
    </>
  );
}
