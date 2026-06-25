import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { JsonLd } from "@/components/JsonLd";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import Link from "next/link";
import { PUBLIC_MARKETING_COPY } from "@/i18n";
import { BRAND_LOGO_PATH, languageAlternates, metadataDescription, socialImages } from "@/lib/seo";
import { getPublishedBlogPosts } from "@/lib/blog";
import { FALLBACK_BLOG_POSTS } from "@/lib/blog-articles";
import { schemaId } from "@/lib/geo";

const AUTHORS = {
  "recv-core": {
    en: {
      name: "Recv Core Team",
      bio: "The recv engineering and product team publishes practical guidance on non-custodial crypto payments, APIs, webhooks, and operations.",
      role: "Engineering & Product",
      expertise: ["Non-custodial payments", "Payment APIs", "Webhook security", "Multi-chain operations"],
    },
    ru: {
      name: "Recv Core Team",
      bio: "Команда разработки и продукта recv публикует практические материалы о non-custodial криптоплатежах, API, вебхуках и эксплуатации.",
      role: "Разработка и продукт",
      expertise: ["Non-custodial платежи", "Платёжные API", "Безопасность вебхуков", "Multi-chain операции"],
    },
    avatar: BRAND_LOGO_PATH,
  },
};

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, locale } = await props.params;
  const author = AUTHORS[slug as keyof typeof AUTHORS];
  const lang = locale === "ru" ? "ru" : "en";
  
  if (!author) return { title: "Author Not Found" };
  const data = author[lang];

  return {
    title: lang === "ru" ? `${data.name}: публикации команды | recv` : `${data.name}: Team Publications | recv`,
    description: metadataDescription(lang, data.bio),
    alternates: {
      canonical: `/${locale}/blog/author/${slug}`,
      languages: languageAlternates(`/blog/author/${slug}`),
    },
    openGraph: {
      images: socialImages(lang, data.name, lang === "ru" ? "Блог" : "Blog"),
    },
  };
}

export default async function AuthorPage(props: Props) {
  const { slug, locale } = await props.params;
  if (locale !== "ru" && locale !== "en") {
    redirect(`/en/blog/author/${slug}`);
  }
  const author = AUTHORS[slug as keyof typeof AUTHORS];

  if (!author) notFound();

  const lang = locale === "ru" ? "ru" : "en";
  const data = author[lang];
  const copy = PUBLIC_MARKETING_COPY[lang];
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://recv.money").replace(/\/+$/, "");
  const publishedPosts = (await getPublishedBlogPosts(lang)).filter(
    (post) => (post.author_slug || "recv-core") === slug,
  );
  const isDevOrTest = process.env.PLAYWRIGHT_TEST === "true";
  const posts = publishedPosts.length
    ? publishedPosts
    : (isDevOrTest ? FALLBACK_BLOG_POSTS[lang] : []);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": schemaId(`/${locale}/blog/author/${slug}`, "profile"),
    name: data.name,
    description: data.bio,
    url: `${baseUrl}/${locale}/blog/author/${slug}`,
    logo: `${baseUrl}${author.avatar}`,
  };

  return (
    <MarketingLayout language={lang} path={`/blog/author/${slug}`} pageType="ProfilePage" mainEntityId={schemaId(`/${locale}/blog/author/${slug}`, "profile")}>
      <JsonLd schema={organizationSchema} />
      <BreadcrumbJsonLd
        items={[
          { name: copy.breadcrumbs.home, href: `/${locale}` },
          { name: copy.breadcrumbs.blog, href: `/${locale}/blog` },
          { name: data.name, href: `/${locale}/blog/author/${slug}` },
        ]}
      />
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/15 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-12">
            <Link href={`/${locale}`} className="hover:text-accent transition-colors">{copy.breadcrumbs.home}</Link>
            <span className="text-white/15">/</span>
            <Link href={`/${locale}/blog`} className="hover:text-accent transition-colors">{copy.breadcrumbs.blog}</Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{data.name}</span>
          </nav>

          <div className="lend-card lend-spotlight-card relative p-10 md:p-14 text-center flex flex-col items-center">
            <div className="lend-card-spotlight" />
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-accent/30 rounded-full blur-2xl opacity-40" />
              <Image
                src={author.avatar}
                alt={lang === "ru" ? "Логотип команды recv" : "recv team logo"}
                width={112}
                height={112}
                className="relative w-28 h-28 rounded-full object-cover border-2 border-accent/30"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{data.name}</h1>
            <span className="text-[11px] font-bold tracking-[0.3em] text-accent/70 uppercase mb-6">{data.role}</span>
            <p className="text-base md:text-lg text-white/55 leading-relaxed max-w-xl">{data.bio}</p>
            <ul className="mt-8 flex flex-wrap justify-center gap-2" aria-label={lang === "ru" ? "Экспертиза команды" : "Team expertise"}>
              {data.expertise.map((item) => (
                <li key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-white/40 mb-4">
              {lang === "ru" ? `Статьи автора` : `Articles by ${data.name}`}
            </h2>
            <ul className="grid gap-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="lend-card flex items-center justify-between gap-4 p-5 transition-transform hover:scale-[1.01]"
                  >
                    <span className="font-semibold text-white/85">{post.title}</span>
                    <time className="shrink-0 text-xs text-white/35" dateTime={post.published_at}>
                      {new Intl.DateTimeFormat(lang, { year: "numeric", month: "short", day: "numeric" }).format(new Date(post.published_at))}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
