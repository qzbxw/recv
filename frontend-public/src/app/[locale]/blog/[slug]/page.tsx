import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { BlogPostClient } from "@/components/blog/BlogPostClient";
import { getPublishedBlogPost, type PublicBlogPost } from "@/lib/blog";
import { isNonSelfCanonical } from "@/lib/seo";

const FALLBACK_POSTS: Record<"en" | "ru", Record<string, PublicBlogPost>> = {
  en: {
    "non-custodial-crypto-checkout": {
      slug: "non-custodial-crypto-checkout",
      title: "How non-custodial crypto checkout works",
      excerpt: "A practical overview of direct-to-wallet invoices, payment detection, and webhook-based fulfillment.",
      author: "recv Core Team",
      cover_image_url: null,
      published_at: "2026-03-13T00:00:00.000Z",
      updated_at: "2026-03-13T00:00:00.000Z",
      canonical_url: null,
      locale: "en",
      content_md: "## Direct settlement\n\nrecv creates payment instructions while funds settle directly to the merchant wallet.\n\n## Detection and fulfillment\n\nThe watcher observes supported networks, matches transfers to invoices, and emits signed webhooks for fulfillment.",
    },
  },
  ru: {
    "non-custodial-crypto-checkout": {
      slug: "non-custodial-crypto-checkout",
      title: "Как работает non-custodial crypto checkout",
      excerpt: "Практичный обзор direct-to-wallet инвойсов, детекции платежей и webhook-выдачи.",
      author: "recv Core Team",
      cover_image_url: null,
      published_at: "2026-03-13T00:00:00.000Z",
      updated_at: "2026-03-13T00:00:00.000Z",
      canonical_url: null,
      locale: "ru",
      content_md: "## Прямое зачисление\n\nrecv создает платежные инструкции, а средства приходят напрямую на кошелек продавца.\n\n## Детекция и выдача\n\nWatcher наблюдает поддерживаемые сети, сопоставляет переводы с инвойсами и отправляет подписанные webhooks для выдачи.",
    },
  },
} as const;

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

function authorSlug(author?: string | null) {
  if (!author || author === "recv Core Team") return "recv-core";
  return author.toLowerCase().trim().replace(/\s+/g, "-");
}

export async function generateMetadata(
  props: Props
): Promise<Metadata> {
  const params = await props.params;
  const language = params.locale === "ru" ? "ru" : "en";
  const post = await getPublishedBlogPost(params.slug, language) || FALLBACK_POSTS[language][params.slug as keyof typeof FALLBACK_POSTS[typeof language]];

  if (!post) {
    return { title: params.locale === "ru" ? "Материал не найден" : "Post Not Found" };
  }
  const selfPath = `/${language}/blog/${params.slug}`;
  const hasDifferentCanonical = isNonSelfCanonical(post.canonical_url, selfPath);

  return {
    title: `${post.title} | recv Blog`,
    description: post.excerpt || "Read the latest updates and engineering insights from recv.",
    alternates: {
      canonical: post.canonical_url || selfPath,
    },
    robots: hasDifferentCanonical ? { index: false, follow: true } : undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}

export default async function BlogPost(props: Props) {
  const params = await props.params;
  const language = params.locale as "ru" | "en";
  const post = await getPublishedBlogPost(params.slug, language) || FALLBACK_POSTS[language][params.slug as keyof typeof FALLBACK_POSTS[typeof language]];

  if (!post) {
    notFound();
  }

  const blogPostSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.cover_image_url ? [post.cover_image_url] : [],
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "inLanguage": language,
    "mainEntityOfPage": post.canonical_url || `https://recv.money/${language}/blog/${post.slug}`,
    "author": [{
      "@type": "Person",
      "name": post.author || "recv Core Team",
      "url": `https://recv.money/${language}/blog/author/${authorSlug(post.author)}`
    }]
  };

  return (
    <>
      <JsonLd schema={blogPostSchema} />
      <BlogPostClient language={language} post={post} />
    </>
  );
}
