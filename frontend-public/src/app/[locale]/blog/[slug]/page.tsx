import Link from "next/link";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { JsonLd } from "@/components/JsonLd";
import { BlogPostClient } from "@/components/blog/BlogPostClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

const FALLBACK_POSTS = {
  en: {
    "non-custodial-crypto-checkout": {
      slug: "non-custodial-crypto-checkout",
      title: "How non-custodial crypto checkout works",
      excerpt: "A practical overview of direct-to-wallet invoices, payment detection, and webhook-based fulfillment.",
      author: "Reqst Core Team",
      published_at: "2026-03-13T00:00:00.000Z",
      updated_at: "2026-03-13T00:00:00.000Z",
      content_md: "## Direct settlement\n\nReqst creates payment instructions while funds settle directly to the merchant wallet.\n\n## Detection and fulfillment\n\nThe watcher observes supported networks, matches transfers to invoices, and emits signed webhooks for fulfillment.",
    },
  },
  ru: {
    "non-custodial-crypto-checkout": {
      slug: "non-custodial-crypto-checkout",
      title: "Как работает non-custodial crypto checkout",
      excerpt: "Практичный обзор direct-to-wallet инвойсов, детекции платежей и webhook-выдачи.",
      author: "Reqst Core Team",
      published_at: "2026-03-13T00:00:00.000Z",
      updated_at: "2026-03-13T00:00:00.000Z",
      content_md: "## Прямое зачисление\n\nReqst создает платежные инструкции, а средства приходят напрямую на кошелек продавца.\n\n## Детекция и выдача\n\nWatcher наблюдает поддерживаемые сети, сопоставляет переводы с инвойсами и отправляет подписанные webhooks для выдачи.",
    },
  },
} as const;

async function getPost(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/public/blog/${slug}`, { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata(
  props: Props
): Promise<Metadata> {
  const params = await props.params;
  const language = params.locale === "ru" ? "ru" : "en";
  const post = await getPost(params.slug) || FALLBACK_POSTS[language][params.slug as keyof typeof FALLBACK_POSTS[typeof language]];

  if (!post) {
    return { title: params.locale === "ru" ? "Материал не найден" : "Post Not Found" };
  }

  return {
    title: `${post.title} | Reqst Blog`,
    description: post.excerpt || "Read the latest updates and engineering insights from Reqst.",
    alternates: {
      canonical: `/${params.locale}/blog/${params.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}

export default async function BlogPost(props: Props) {
  const params = await props.params;
  const language = params.locale as "ru" | "en";
  const post = await getPost(params.slug) || FALLBACK_POSTS[language][params.slug as keyof typeof FALLBACK_POSTS[typeof language]];

  if (!post) {
    return (
      <MarketingLayout language={language}>
        <section className="container mx-auto px-6 max-w-2xl text-center py-32">
          <span className="lend-section-kicker justify-center mx-auto">404</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">{language === "ru" ? "Материал не найден" : "Post not found"}</h1>
          <p className="text-white/50 mb-10">{language === "ru" ? "Похоже, этой страницы больше нет." : "This article may have moved or been removed."}</p>
          <Link href={`/${language}/blog`} className="lend-primary px-8 py-4 rounded-xl inline-flex items-center gap-2">
            <span>←</span> {language === "ru" ? "В блог" : "Back to blog"}
          </Link>
        </section>
      </MarketingLayout>
    );
  }

  const blogPostSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.cover_image_url ? [post.cover_image_url] : [],
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "author": [{
      "@type": "Person",
      "name": post.author || "Reqst Core Team",
      "url": `https://reqst.xyz/${language}/blog/author/${(post.author || "reqst-core").toLowerCase().replace(/\s+/g, '-')}`
    }]
  };

  return (
    <>
      <JsonLd schema={blogPostSchema} />
      <BlogPostClient language={language} post={post} />
    </>
  );
}
