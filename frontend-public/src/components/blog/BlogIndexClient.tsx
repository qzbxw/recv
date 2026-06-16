"use client";

import Link from "next/link";
import Image from "next/image";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { useReveal } from "@/components/marketing/useReveal";

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt?: string | null;
  author?: string | null;
  cover_image_url?: string | null;
  cover_image_width?: number;
  cover_image_height?: number;
  cover_image_alt?: string | null;
  published_at: string;
};

function formatDate(value: string, locale: "en" | "ru") {
  try {
    return new Date(value).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function initials(name?: string | null) {
  if (!name) return "RQ";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function BlogIndexClient({
  language,
  posts,
}: {
  language: "en" | "ru";
  posts: BlogPostSummary[];
}) {
  const reveal = useReveal();
  const [featured, ...rest] = posts;

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <MarketingLayout language={language}>
      {/* HERO */}
      <section className="lend-hero--centered relative overflow-hidden" ref={reveal}>
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl">
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
            <Link href={`/${language}`} className="hover:text-accent transition-colors">
              {language === "ru" ? "Главная" : "Home"}
            </Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{language === "ru" ? "Блог" : "Blog"}</span>
          </nav>
          <span className="lend-reveal--1 lend-section-kicker justify-center mx-auto">{language === "ru" ? "БЛОГ" : "BLOG"}</span>
          <h1 className="lend-reveal--2 !text-4xl md:!text-6xl lg:!text-7xl font-black tracking-tighter leading-[1.05] mb-8">
            <span className="text-white">{language === "ru" ? "Инженерия и " : "Engineering & "}</span>
            <span className="bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(124,58,237,0.15)]">
              {language === "ru" ? "обновления" : "updates"}
            </span>
          </h1>
          <p className="lend-reveal--3 !text-lg md:!text-xl text-white/55 leading-relaxed max-w-2xl mx-auto">
            {language === "ru"
              ? "Технические разборы, обновления продукта и заметки об инфраструктуре криптоплатежей от core-команды."
              : "Protocol insights, technical deep-dives, and platform updates from the core team."}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24" ref={reveal}>
        <div className="container mx-auto px-6">
          {featured && (
            <Link
              href={`/${language}/blog/${featured.slug}`}
              className="lend-card lend-spotlight-card group relative grid md:grid-cols-2 gap-0 overflow-hidden mb-12 lend-reveal--1 transition-all duration-700 hover:scale-[1.01]"
              onMouseMove={handleMouseMove}
            >
              <div className="lend-card-spotlight" />
              <div
                className="relative min-h-[260px] md:min-h-[420px] bg-gradient-to-br from-purple-600/20 via-violet-600/10 to-indigo-600/20 overflow-hidden"
                style={featured.cover_image_url && !featured.cover_image_url.startsWith("/media/")
                  ? { backgroundImage: `url(${featured.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : undefined}
              >
                {featured.cover_image_url?.startsWith("/media/") ? (
                  <Image
                    src={featured.cover_image_url}
                    alt={featured.cover_image_alt || featured.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : null}
                {!featured.cover_image_url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8rem] font-black italic text-white/5 font-['Montserrat'] select-none">R</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/40" />
              </div>
              <div className="relative z-10 p-10 md:p-14 flex flex-col justify-center">
                <span className="text-[10px] font-bold tracking-[0.3em] text-accent/70 mb-6 block uppercase">
                  {language === "ru" ? "Свежий материал" : "Featured"}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-5 tracking-tight leading-tight group-hover:text-white transition-colors">{featured.title}</h2>
                {featured.excerpt && <p className="opacity-50 text-base md:text-lg leading-relaxed mb-8 group-hover:opacity-75 transition-opacity">{featured.excerpt}</p>}
                <div className="flex items-center gap-4 text-sm">
                  <span className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[11px] font-bold text-accent">{initials(featured.author)}</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white/80">{featured.author || "recv Core Team"}</span>
                    <span className="text-white/30 text-xs">{formatDate(featured.published_at, language)}</span>
                  </div>
                  <span className="ml-auto lend-arrow text-accent text-xl group-hover:translate-x-1.5 transition-transform duration-500">→</span>
                </div>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lend-reveal--2">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${language}/blog/${post.slug}`}
                  className="lend-card lend-spotlight-card group relative flex flex-col overflow-hidden transition-all duration-700 hover:scale-[1.02]"
                  onMouseMove={handleMouseMove}
                >
                  <div className="lend-card-spotlight" />
                  <div
                    className="relative h-44 bg-gradient-to-br from-purple-600/20 via-violet-600/10 to-indigo-600/20 overflow-hidden"
                    style={post.cover_image_url && !post.cover_image_url.startsWith("/media/")
                      ? { backgroundImage: `url(${post.cover_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined}
                  >
                    {post.cover_image_url?.startsWith("/media/") ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.cover_image_alt || post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : null}
                    {!post.cover_image_url && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl font-black italic text-white/5 font-['Montserrat'] select-none">R</span>
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-4 tracking-tight leading-snug group-hover:text-white transition-colors">{post.title}</h3>
                    {post.excerpt && <p className="opacity-50 text-sm leading-relaxed mb-6 flex-grow group-hover:opacity-70 transition-opacity line-clamp-3">{post.excerpt}</p>}
                    <div className="flex items-center gap-3 text-xs mt-auto pt-4 border-t border-white/5">
                      <span className="font-semibold text-white/70">{post.author || "recv Team"}</span>
                      <span className="text-white/20">•</span>
                      <span className="text-white/30">{formatDate(post.published_at, language)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {posts.length === 0 && (
            <div className="text-center py-24 text-white/40 lend-reveal--1">
              {language === "ru" ? "Скоро появятся материалы." : "Articles coming soon."}
            </div>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}
