/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-unused-vars */
import Link from "next/link";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { JsonLd } from "@/components/JsonLd";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

async function getPost(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/public/blog/${slug}`, { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch blog post", error);
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
  const post = await getPost(params.slug);

  if (!post) {
    return { title: "Post Not Found" };
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
  const post = await getPost(params.slug);
  const language = params.locale as "ru" | "en";

  if (!post) {
    return (
      <MarketingLayout language={language}>
        <div className="blog-empty" style={{ padding: "10rem 2rem" }}>
          <h1 className="blog-card__title" style={{ fontSize: "2rem", marginBottom: "1rem" }}>Post Not Found</h1>
          <Link href={`/${language}/blog`} style={{ color: "var(--accent)" }}>&larr; Back to Blog</Link>
        </div>
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
    <MarketingLayout language={language}>
        <JsonLd schema={blogPostSchema} />
        <article className="article-shell">
          <header className="article-header">
            <h1 className="article-title">
              {post.title}
            </h1>
            <div className="article-meta">
              <span>{post.author || "Reqst Core Team"}</span>
              <span>&bull;</span>
              <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            </div>
          </header>

          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.title} className="article-cover" />
          )}

          <div className="markdown-body">
            <ReactMarkdown
              components={{
                h2: ({node: _node, ...props}) => <h2 {...props} />,
                h3: ({node: _node, ...props}) => <h3 {...props} />,
                p: ({node: _node, ...props}) => <p {...props} />,
                a: ({node: _node, ...props}) => <a {...props} />,
                code: ({inline, ...props}: { inline?: boolean; children?: React.ReactNode }) => 
                  inline ? <code {...props} />
                         : <pre {...props}><code {...props} /></pre>,
                blockquote: ({node: _node, ...props}) => <blockquote {...props} />,
                ul: ({node: _node, ...props}) => <ul {...props} />,
                ol: ({node: _node, ...props}) => <ol {...props} />,
                li: ({node: _node, ...props}) => <li {...props} />
              }}
            >
              {post.content_md}
            </ReactMarkdown>
          </div>
        </article>
    </MarketingLayout>
  );
}
