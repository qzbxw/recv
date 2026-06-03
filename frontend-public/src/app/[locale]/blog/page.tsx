import { Metadata } from "next";
import { BlogIndexClient, type BlogPostSummary } from "@/components/blog/BlogIndexClient";

export const metadata: Metadata = {
  title: "Blog | recv",
  description: "Insights, technical deep-dives, and updates on crypto payments infrastructure.",
  openGraph: {
    title: "Blog | recv",
    description: "Insights, technical deep-dives, and updates on crypto payments infrastructure.",
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

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

async function getPosts(): Promise<BlogPostSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/api/public/blog`, { 
      next: { revalidate: 60 } // Revalidate every minute
    });
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as { items?: BlogPostSummary[] };
    return data.items || [];
  } catch {
    return [];
  }
}

export default async function BlogIndex(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const language = locale === "ru" ? "ru" : "en";
  const posts = (await getPosts()).filter((post) => post.slug) || [];
  const visiblePosts = posts.length > 0 ? posts : FALLBACK_POSTS[language];

  return <BlogIndexClient language={language} posts={visiblePosts} />;
}
