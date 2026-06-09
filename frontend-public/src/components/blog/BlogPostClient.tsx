"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { MarketingLayout, useReveal } from "@/components/marketing/MarketingLayout";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt?: string | null;
  author?: string | null;
  cover_image_url?: string | null;
  published_at: string;
  updated_at?: string | null;
  content_md: string;
};

const mdComponents: Components = {
  h2: (props) => <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-14 mb-5 text-white scroll-mt-32" {...props} />,
  h3: (props) => <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-10 mb-4 text-white/90" {...props} />,
  p: (props) => <p className="text-base md:text-lg leading-[1.8] text-white/60 mb-6" {...props} />,
  a: (props) => <a className="text-accent font-medium underline decoration-accent/30 underline-offset-4 hover:decoration-accent transition-colors" {...props} />,
  ul: (props) => <ul className="list-none space-y-3 mb-6 pl-1" {...props} />,
  ol: (props) => <ol className="list-decimal space-y-3 mb-6 pl-6 text-white/60 marker:text-accent/60" {...props} />,
  li: (props) => (
    <li className="text-base md:text-lg leading-[1.7] text-white/60 relative pl-6 [&>ul]:mt-3 [&>ol]:mt-3 before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent/50" {...props} />
  ),
  blockquote: (props) => <blockquote className="border-l-2 border-accent/40 pl-6 py-1 my-8 text-white/70 italic text-lg" {...props} />,
  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { node?: unknown }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className="block text-sm leading-relaxed" {...props}>{children}</code>;
    }
    return <code className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-accent text-[0.9em] font-mono" {...props}>{children}</code>;
  },
  pre: (props) => <pre className="rounded-2xl bg-[#0a0a0c] border border-white/10 p-6 overflow-x-auto my-8 text-white/80" {...props} />,
  hr: () => <hr className="border-white/10 my-12" />,
  table: (props) => (
    <div className="overflow-x-auto my-8 rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm border-collapse" {...props} />
    </div>
  ),
  th: (props) => <th className="px-5 py-3 bg-white/[0.03] font-bold text-white/80 border-b border-white/10 text-xs uppercase tracking-wider" {...props} />,
  td: (props) => <td className="px-5 py-3 text-white/60 border-b border-white/5" {...props} />,
  img: ({ src, alt }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} className="rounded-2xl border border-white/10 my-8 w-full" />,
};

function formatDate(value: string, locale: "en" | "ru") {
  try {
    return new Date(value).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

function initials(name?: string | null) {
  if (!name) return "RQ";
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function BlogPostClient({ language, post }: { language: "en" | "ru"; post: BlogPost }) {
  const reveal = useReveal();
  const authorSlug = !post.author || post.author === "recv Core Team"
    ? "recv-core"
    : post.author.toLowerCase().trim().replace(/\s+/g, "-");

  return (
    <MarketingLayout language={language}>
      <article className="relative pt-28 md:pt-32">
        {/* HERO */}
        <header className="relative overflow-hidden pb-12" ref={reveal}>
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/15 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10 max-w-3xl">
            <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
              <Link href={`/${language}`} className="hover:text-accent transition-colors">{language === "ru" ? "Главная" : "Home"}</Link>
              <span className="text-white/15">/</span>
              <Link href={`/${language}/blog`} className="hover:text-accent transition-colors">{language === "ru" ? "Блог" : "Blog"}</Link>
            </nav>

            <h1 className="lend-reveal--2 text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.05] mb-8 text-white">
              {post.title}
            </h1>

            <div className="lend-reveal--3 flex items-center gap-4">
              <Link href={`/${language}/blog/author/${authorSlug}`} className="w-11 h-11 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent hover:scale-105 transition-transform">
                {initials(post.author)}
              </Link>
              <div className="flex flex-col">
                <Link href={`/${language}/blog/author/${authorSlug}`} className="font-semibold text-white/85 hover:text-accent transition-colors">{post.author || "recv Core Team"}</Link>
                <time dateTime={post.published_at} className="text-white/35 text-sm">{formatDate(post.published_at, language)}</time>
              </div>
            </div>
          </div>
        </header>

        {post.cover_image_url && (
          <div className="container mx-auto px-6 max-w-4xl mb-12" ref={reveal}>
            <img src={post.cover_image_url} alt={post.title} className="lend-reveal--1 w-full rounded-3xl border border-white/10" />
          </div>
        )}

        {/* BODY */}
        <div className="container mx-auto px-6 max-w-3xl pb-24" ref={reveal}>
          <div className="lend-reveal--1">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{post.content_md}</ReactMarkdown>

            <div className="mt-16 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <Link href={`/${language}/blog`} className="lend-secondary px-6 py-3 rounded-xl group/back flex items-center gap-2">
                <span className="group-hover/back:-translate-x-1 transition-transform duration-500">←</span>
                {language === "ru" ? "Все материалы" : "All articles"}
              </Link>
              <Link href="/app/auth" className="lend-primary px-8 py-3 rounded-xl flex items-center gap-2 group/cta">
                {language === "ru" ? "Начать с recv" : "Start with recv"}
                <span className="group-hover/cta:translate-x-1.5 transition-transform duration-500">→</span>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}
