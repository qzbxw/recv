/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { JsonLd } from "@/components/JsonLd";
import Link from "next/link";
import { PUBLIC_MARKETING_COPY } from "@/i18n";
import { languageAlternates } from "@/lib/seo";

const AUTHORS = {
  "recv-core": {
    name: "recv Core Team",
    bio: "The engineering team behind recv protocol. Focused on building high-performance, non-custodial crypto infrastructure.",
    role: "Engineering & Product",
    avatar: "/logo.png"
  }
};

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, locale } = await props.params;
  const data = AUTHORS[slug as keyof typeof AUTHORS];
  
  if (!data) return { title: "Author Not Found" };

  return {
    title: `${data.name} | recv Blog`,
    description: data.bio,
    alternates: {
      canonical: `/${locale}/blog/author/${slug}`,
      languages: languageAlternates(`/blog/author/${slug}`),
    },
  };
}

export default async function AuthorPage(props: Props) {
  const { slug, locale } = await props.params;
  const data = AUTHORS[slug as keyof typeof AUTHORS];

  if (!data) notFound();

  const lang = locale === "ru" ? "ru" : "en";
  const copy = PUBLIC_MARKETING_COPY[lang];
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://recv.money").replace(/\/+$/, "");

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    jobTitle: data.role,
    description: data.bio,
    url: `${baseUrl}/${locale}/blog/author/${slug}`,
    worksFor: { "@type": "Organization", name: "recv" },
  };

  return (
    <MarketingLayout language={lang}>
      <JsonLd schema={personSchema} />
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/15 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-12">
            <Link href={`/${locale}`} className="hover:text-accent transition-colors">{copy.breadcrumbs.home}</Link>
            <span className="text-white/15">/</span>
            <Link href={`/${locale}/blog`} className="hover:text-accent transition-colors">{copy.breadcrumbs.blog}</Link>
          </nav>

          <div className="lend-card lend-spotlight-card relative p-10 md:p-14 text-center flex flex-col items-center">
            <div className="lend-card-spotlight" />
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-accent/30 rounded-full blur-2xl opacity-40" />
              <img src={data.avatar} alt={data.name} className="relative w-28 h-28 rounded-full object-cover border-2 border-accent/30" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{data.name}</h1>
            <span className="text-[11px] font-bold tracking-[0.3em] text-accent/70 uppercase mb-6">{data.role}</span>
            <p className="text-base md:text-lg text-white/55 leading-relaxed max-w-xl">{data.bio}</p>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-white/40 mb-4">
              {lang === "ru" ? `Статьи автора` : `Articles by ${data.name}`}
            </h2>
            <p className="text-white/40">
              {lang === "ru" ? "Скоро. Загляните в " : "Coming soon. Browse the "}
              <Link href={`/${locale}/blog`} className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent transition-colors">
                {lang === "ru" ? "блог" : "full blog"}
              </Link>
              {lang === "ru" ? " — там свежие материалы." : " for recent updates."}
            </p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
