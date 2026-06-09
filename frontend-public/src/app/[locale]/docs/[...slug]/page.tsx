import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocBySlug, getAllDocSlugs } from "@/lib/docs";
import { metadataDescription, socialImages } from "@/lib/seo";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { JsonLd } from "@/components/JsonLd";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { docsMdxComponents } from "@/components/docs/mdxComponents";
import { getCopy, normalizeLocale } from "@/i18n";
import Link from "next/link";

const DOC_ORDER = ["introduction", "quickstart", "authentication", "invoices", "webhooks", "errors", "mcp", "networks"];

function docLabel(slug: string[]) {
  const first = slug[0] ?? "";
  return first.charAt(0).toUpperCase() + first.slice(1).replace(/-/g, " ");
}

function orderSlugs(slugs: string[][]) {
  return [...slugs].sort((a, b) => {
    const ai = DOC_ORDER.indexOf(a[0]);
    const bi = DOC_ORDER.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const doc = getDocBySlug(slug, locale);
  if (!doc) {
    return {};
  }
  const path = `/docs/${slug.join("/")}`;
  const title = (doc.data.title as string) || "Documentation";
  const description = metadataDescription(locale,
    (doc.data.description as string) ||
    (locale === "ru"
      ? "Документация recv: API, вебхуки, сети и интеграция криптоплатежей."
      : "recv documentation: API, webhooks, supported networks, and crypto payment integration."));
  return {
    title: `${title} | recv Docs`,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        en: `/en${path}`,
        ru: `/ru${path}`,
        "x-default": `/en${path}`,
      },
    },
    openGraph: {
      images: socialImages(locale, title, locale === "ru" ? "Документация" : "Docs"),
    },
  };
}

export async function generateStaticParams() {
  const locales = ["en", "ru"];
  const params: { locale: string; slug: string[] }[] = [];

  for (const locale of locales) {
    const slugs = getAllDocSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export default async function DocPage(props: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale: rawLocale, slug } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const doc = getDocBySlug(slug, locale);

  if (!doc) {
    notFound();
  }

  const copy = getCopy(locale);
  const allSlugs = orderSlugs(getAllDocSlugs(locale));
  const currentKey = slug.join("/");
  const currentIndex = allSlugs.findIndex((s) => s.join("/") === currentKey);
  const prevDoc = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
  const nextDoc = currentIndex >= 0 && currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: doc.data.title as string,
    description: metadataDescription(locale, (doc.data.description as string) || (doc.data.title as string)),
    inLanguage: locale,
    url: `https://recv.money/${locale}/docs/${slug.join("/")}`,
    author: { "@type": "Organization", name: "recv" },
    publisher: { "@type": "Organization", name: "recv" },
  };

  return (
    <MarketingLayout language={locale}>
      <JsonLd schema={articleSchema} />
      <BreadcrumbJsonLd
        items={[
          { name: copy.marketing.breadcrumbs.home, href: `/${locale}` },
          { name: copy.nav.docs, href: `/${locale}/docs/introduction` },
          { name: docLabel(slug), href: `/${locale}/docs/${slug.join("/")}` },
        ]}
      />
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-10 lg:gap-14 pt-28 md:pt-32 pb-24">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-28">
            <span className="block text-[10px] font-bold tracking-[0.3em] uppercase text-accent/60 mb-6">
              {locale === "ru" ? "Документация" : "Documentation"}
            </span>
            <ul className="flex flex-col gap-1 border-l border-white/10">
              {allSlugs.map((s) => {
                const active = currentKey === s.join("/");
                return (
                  <li key={s.join("/")}>
                    <Link
                      href={`/${locale}/docs/${s.join("/")}`}
                      className={`block -ml-px pl-5 py-2 text-sm border-l-2 transition-all ${
                        active
                          ? "border-accent text-white font-semibold"
                          : "border-transparent text-white/45 hover:text-white/80 hover:border-white/20"
                      }`}
                    >
                      {docLabel(s)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Article */}
        <article className="min-w-0 max-w-3xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-8">
            <Link href={`/${locale}`} className="hover:text-accent transition-colors">{copy.marketing.breadcrumbs.home}</Link>
            <span className="text-white/15">/</span>
            <Link href={`/${locale}/docs/introduction`} className="hover:text-accent transition-colors">{copy.nav.docs}</Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{docLabel(slug)}</span>
          </nav>

          {doc.data.description ? (
            <header className="mb-10 pb-8 border-b border-white/10">
              <p className="text-lg md:text-xl text-white/55 leading-relaxed">{doc.data.description as string}</p>
            </header>
          ) : null}

          <div className="docs-prose">
            <MDXRemote
              source={doc.content}
              components={docsMdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </div>

          {/* Prev / Next */}
          <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevDoc ? (
              <Link href={`/${locale}/docs/${prevDoc.join("/")}`} className="lend-card group p-5 flex flex-col gap-1 hover:scale-[1.02] transition-transform duration-500">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">{locale === "ru" ? "← Назад" : "← Previous"}</span>
                <span className="font-semibold group-hover:text-accent transition-colors">{docLabel(prevDoc)}</span>
              </Link>
            ) : <span />}
            {nextDoc ? (
              <Link href={`/${locale}/docs/${nextDoc.join("/")}`} className="lend-card group p-5 flex flex-col gap-1 text-right hover:scale-[1.02] transition-transform duration-500">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">{locale === "ru" ? "Далее →" : "Next →"}</span>
                <span className="font-semibold group-hover:text-accent transition-colors">{docLabel(nextDoc)}</span>
              </Link>
            ) : <span />}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-between rounded-2xl border border-accent/15 bg-accent/[0.03] p-6">
            <p className="text-sm text-white/55">{locale === "ru" ? "Готовы принимать криптоплатежи?" : "Ready to accept crypto payments?"}</p>
            <div className="flex gap-3">
              <Link href="/app/auth" className="lend-primary px-6 py-3 rounded-xl text-sm">{copy.hero.primary}</Link>
              <Link href={`/${locale}/networks`} className="lend-secondary px-6 py-3 rounded-xl text-sm">{copy.marketing.breadcrumbs.networks}</Link>
            </div>
          </div>
        </article>
      </div>
    </MarketingLayout>
  );
}
