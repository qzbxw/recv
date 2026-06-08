import { Metadata } from "next";
import { BlogIndexClient, type BlogPostSummary } from "@/components/blog/BlogIndexClient";
import { getPublishedBlogPosts } from "@/lib/blog";
import { languageAlternates } from "@/lib/seo";

const FALLBACK_POSTS: Record<"en" | "ru", BlogPostSummary[]> = {
  en: [
    {
      slug: "non-custodial-crypto-checkout",
      title: "How non-custodial crypto checkout works",
      excerpt: "A practical overview of direct-to-wallet invoices, payment detection, and webhook-based fulfillment.",
      author: "recv Core Team",
      published_at: "2026-03-13T00:00:00.000Z",
    },
  ],
  ru: [
    {
      slug: "non-custodial-crypto-checkout",
      title: "Как работает non-custodial crypto checkout",
      excerpt: "Практичный обзор direct-to-wallet инвойсов, детекции платежей и webhook-выдачи.",
      author: "recv Core Team",
      published_at: "2026-03-13T00:00:00.000Z",
    },
  ],
};

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const language = locale === "ru" ? "ru" : "en";
  const description =
    language === "ru"
      ? "Технические разборы и обновления инфраструктуры криптоплатежей recv."
      : "Insights, technical deep-dives, and updates on crypto payments infrastructure.";
  return {
    title: language === "ru" ? "Блог | recv" : "Blog | recv",
    description,
    alternates: {
      canonical: `/${language}/blog`,
      languages: languageAlternates("/blog"),
    },
    openGraph: { title: language === "ru" ? "Блог | recv" : "Blog | recv", description },
  };
}

export default async function BlogIndex(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const language = locale === "ru" ? "ru" : "en";
  const posts = (await getPublishedBlogPosts(language)).filter((post) => post.slug) as BlogPostSummary[];
  const visiblePosts = posts.length > 0 ? posts : FALLBACK_POSTS[language];

  return <BlogIndexClient language={language} posts={visiblePosts} />;
}
