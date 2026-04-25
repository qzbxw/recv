import Link from "next/link";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export const metadata: Metadata = {
  title: "Blog | Reqst",
  description: "Insights, technical deep-dives, and updates on crypto payments infrastructure.",
  openGraph: {
    title: "Blog | Reqst",
    description: "Insights, technical deep-dives, and updates on crypto payments infrastructure.",
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt?: string | null;
  author?: string | null;
  cover_image_url?: string | null;
  published_at: string;
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
  } catch (error) {
    console.error("Failed to fetch blog posts", error);
    return [];
  }
}

export default async function BlogIndex(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const posts = await getPosts();

  return (
    <MarketingLayout language={locale as "ru" | "en"}>
        <section className="lend-hero lend-hero--centered">
          <div className="lend-hero-copy" style={{ maxWidth: "800px" }}>
            <span className="lend-section-kicker">BLOG</span>
            <h1>Engineering & Updates</h1>
            <p>Protocol insights, technical deep-dives, and platform updates from the core team.</p>
          </div>
        </section>

        <section className="lend-split-section">
          {posts.length === 0 ? (
            <div className="blog-empty">
              <p>No posts available yet.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {posts.map((post) => (
                <Link key={post.slug} href={`/${locale}/blog/${post.slug}`} className="lend-card blog-card">
                  {post.cover_image_url && (
                    <div 
                      className="blog-card__cover"
                      style={{ backgroundImage: `url(${post.cover_image_url})` }} 
                    />
                  )}
                  <h3 className="blog-card__title">{post.title}</h3>
                  {post.excerpt && <p className="blog-card__excerpt">{post.excerpt}</p>}
                  <div className="blog-card__meta">
                    <span>{post.author || "Reqst Team"}</span>
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
    </MarketingLayout>
  );
}
