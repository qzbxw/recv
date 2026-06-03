"use client";

import Link from "next/link";
import { MarketingLayout, useReveal } from "./MarketingLayout";
import { JsonLd } from "../JsonLd";
import { getCopy, normalizeLocale } from "@/i18n";

export type StaticMarketingPageCopy = {
  kicker: string;
  title: string;
  body: string;
  points: Array<{ title: string; body: string }>;
  cta?: string;
};

// Keywords that get the signature gradient treatment in the hero headline.
const GRADIENT_WORDS = new Set([
  "recv",
  "crypto",
  "payments",
  "payment",
  "api",
  "webhooks",
  "checkout",
  "noncustodial",
  "security",
  "usdt",
  "ton",
  "tron",
  "control",
  "infrastructure",
  "криптоплатежей",
  "криптоплатежи",
  "инфраструктура",
  "контролем",
  "безопасность",
  "вебхуки",
  "платежи",
  "помощи",
]);

function isGradientWord(raw: string) {
  const clean = raw.replace(/[.,/#!$%^&*;:{}=\-_`~()—]/g, "").toLowerCase();
  return GRADIENT_WORDS.has(clean);
}

export function StaticMarketingPage({
  locale: rawLocale,
  copy,
}: {
  locale: string;
  copy: StaticMarketingPageCopy;
}) {
  const locale = normalizeLocale(rawLocale);
  const siteCopy = getCopy(locale);
  const reveal = useReveal();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://recv.money").replace(/\/+$/, "");
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteCopy.marketing.breadcrumbs.home, item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: copy.title, item: `${baseUrl}/${locale}` },
    ],
  };

  const points = copy.points;
  const gridCols = points.length % 4 === 0 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <MarketingLayout language={locale}>
      <JsonLd schema={breadcrumbSchema} />

      {/* HERO */}
      <section className="lend-hero--centered relative overflow-hidden" ref={reveal}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
            <Link href={`/${locale}`} className="hover:text-accent transition-colors">{siteCopy.marketing.breadcrumbs.home}</Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{copy.kicker}</span>
          </nav>

          <span className="lend-reveal--2 lend-section-kicker justify-center mx-auto">{copy.kicker}</span>

          <h1 className="lend-reveal--2 !text-4xl md:!text-6xl lg:!text-7xl font-black tracking-tighter leading-[1.05] mb-8">
            {copy.title.split(" ").map((word, i) => (
              <span
                key={i}
                className={`inline-block mr-[0.22em] last:mr-0 transition-all duration-300 hover:scale-105 ${
                  isGradientWord(word)
                    ? "bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(124,58,237,0.15)]"
                    : "text-white hover:text-white"
                }`}
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="lend-reveal--3 !text-lg md:!text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-12">
            {copy.body}
          </p>

          <div className="lend-reveal--4 flex flex-col sm:flex-row items-center justify-center gap-5">
            <div className="relative group/btn-wrap">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-70 group-hover/btn-wrap:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              <Link className="lend-primary relative z-10 px-9 py-4 text-base min-w-[220px] rounded-2xl group/btn flex items-center justify-center" href="/app/auth">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {copy.cta || siteCopy.hero.primary}
                  <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">→</span>
                </span>
              </Link>
            </div>
            <Link className="lend-secondary px-9 py-4 text-base min-w-[220px] rounded-2xl group/sec flex items-center justify-center" href={`/${locale}/docs`}>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {siteCopy.nav.docs}
                <span className="group-hover/sec:translate-x-1.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">→</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* POINTS GRID */}
      <section className="py-24 md:py-32" ref={reveal}>
        <div className="container mx-auto px-6">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6 lend-reveal--2`}>
            {points.map((point, idx) => (
              <article
                key={point.title}
                className="lend-card lend-spotlight-card group relative p-10 flex flex-col justify-between min-h-[280px] transition-all duration-700 ease-in-out hover:scale-[1.02]"
                onMouseMove={handleMouseMove}
              >
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />

                <div className="absolute top-0 right-0 p-8 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none select-none">
                  <span className="text-[8rem] font-black italic leading-none font-['Montserrat']">{String(idx + 1).padStart(2, "0")}</span>
                </div>

                <div className="relative z-10">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 mb-6 block uppercase">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold mb-5 tracking-tight group-hover:text-white transition-colors">{point.title}</h3>
                  <p className="opacity-50 text-base leading-relaxed group-hover:opacity-75 transition-opacity">{point.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 relative overflow-hidden lend-spotlight-card group" onMouseMove={handleMouseMove} ref={reveal}>
        <div className="lend-card-spotlight opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-accent/15 rounded-full blur-[200px] opacity-25 pointer-events-none animate-pulse" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="lend-reveal--1 max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-6">
              {copy.cta || (locale === "ru" ? "Запустить recv" : "Launch recv")}
            </h2>
            <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed font-medium">
              {locale === "ru"
                ? "Non-custodial криптоплатежи напрямую на ваши кошельки. Без комиссии с оборота."
                : "Non-custodial crypto payments straight to your wallets. Zero turnover fees."}
            </p>
          </div>

          <div className="lend-reveal--2 flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link className="lend-primary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center gap-3 group/btn shadow-[0_20px_50px_rgba(124,58,237,0.25)]" href="/app/auth">
              {siteCopy.hero.primary}
              <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
            </Link>
            <Link className="lend-secondary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center gap-2" href={`/${locale}/docs`}>
              {siteCopy.nav.docs}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
