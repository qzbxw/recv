"use client";

import Link from "next/link";
import { useUI } from "./UIProvider";
import { MarketingLayout, useReveal } from "./marketing/MarketingLayout";
import { PUBLIC_LEGAL_COPY as COPY } from "@/i18n";

type LegalVariant = "privacy" | "terms";
type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalCopy = {
  kicker: string;
  title: string;
  summary: string;
  updatedLabel: string;
  operatorLabel: string;
  draftTitle: string;
  draftBody: string;
  draftItems: string[];
  sections: LegalSection[];
  footerNote: string;
  leadTitle?: string;
  leadParagraphs?: string[];
  metaItems?: string[];
};


const LEGAL_PROFILE = {
  operatorName: "Reqst",
  contactEmail: "legal@reqst.xyz",
  supportEmail: "support@reqst.xyz",
  address: "Contact legal@reqst.xyz for formal notices.",
  jurisdiction: "To be specified in the merchant agreement.",
  domain: "reqst.xyz",
  refundPolicy: "Reqst platform subscription refunds are handled case by case according to the active service agreement.",
  effectiveDate: {
    ru: "13 марта 2026",
    en: "March 13, 2026",
  },
} as const;const legalCopy = COPY as unknown as Record<LegalVariant, Record<"ru" | "en", LegalCopy>>;
legalCopy.privacy.en.sections = legalCopy.privacy.ru.sections;
legalCopy.terms.en.sections = legalCopy.terms.ru.sections;

export function LegalPage({ variant }: { variant: LegalVariant }) {
  const { language } = useUI();
  const copy = legalCopy[variant][language];
  const reveal = useReveal();

  return (
    <MarketingLayout language={language}>
      {/* HERO */}
      <section className="relative overflow-hidden pb-12" ref={reveal}>
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-full bg-radial-gradient from-accent/12 via-transparent to-transparent blur-[120px] opacity-40 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 max-w-3xl">
          <span className="lend-reveal--1 lend-section-kicker">{copy.kicker}</span>
          <h1 className="lend-reveal--2 text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] mb-6">{copy.title}</h1>
          <p className="lend-reveal--3 text-lg md:text-xl text-white/55 leading-relaxed mb-8">{copy.summary}</p>

          {copy.leadTitle || copy.leadParagraphs ? (
            <div className="lend-reveal--4 mb-8">
              {copy.leadTitle ? <h2 className="text-xl font-bold mb-3 text-white/90">{copy.leadTitle}</h2> : null}
              {copy.leadParagraphs?.map((paragraph) => (
                <p key={paragraph} className="text-white/55 leading-relaxed mb-3">{paragraph}</p>
              ))}
            </div>
          ) : null}

          <div className="lend-reveal--4 flex flex-wrap gap-3">
            {(copy.metaItems
              ? copy.metaItems
              : [`${copy.updatedLabel}: ${LEGAL_PROFILE.effectiveDate[language]}`, `${copy.operatorLabel}: ${LEGAL_PROFILE.operatorName}`]
            ).map((item) => (
              <span key={item} className="text-xs font-semibold text-white/45 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02]">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* NOTICE */}
      <section className="pb-16" ref={reveal}>
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="lend-reveal--1 rounded-3xl border border-accent/15 bg-accent/[0.03] p-8 md:p-10">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">{copy.draftTitle}</h2>
            <p className="text-white/55 leading-relaxed mb-6">{copy.draftBody}</p>
            <ul className="flex flex-wrap gap-2">
              {copy.draftItems.map((item) => (
                <li key={item} className="text-xs font-mono text-accent/80 px-3 py-1.5 rounded-lg bg-accent/[0.06] border border-accent/15">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <section className="pb-24" ref={reveal}>
        <div className="container mx-auto px-6 max-w-3xl flex flex-col gap-5 lend-reveal--2">
          {copy.sections.map((section, index) => (
            <article key={section.title} className="lend-card relative p-8 md:p-10 group hover:border-accent/20 transition-colors duration-500">
              <div className="flex items-baseline gap-4 mb-5">
                <span className="text-sm font-black text-accent/40 font-['Montserrat'] tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">{section.title}</h2>
              </div>
              <div className="pl-0 md:pl-9">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-white/55 leading-[1.8] mb-4 last:mb-0">{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((item) => (
                      <li key={item} className="text-white/55 leading-relaxed relative pl-6 before:content-[''] before:absolute before:left-0 before:top-[0.65em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent/50">{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER NOTE */}
      <section className="pb-32" ref={reveal}>
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <p className="text-sm text-white/40 mb-8">{copy.footerNote}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
            <Link href={`/${language}/privacy`} className="text-white/50 hover:text-accent transition-colors">Privacy</Link>
            <Link href={`/${language}/terms`} className="text-white/50 hover:text-accent transition-colors">Terms</Link>
            <Link href={`/${language}/docs/introduction`} className="text-white/50 hover:text-accent transition-colors">Docs</Link>
            <Link href={`/${language}/dev`} className="text-white/50 hover:text-accent transition-colors">API</Link>
            <Link href={`/${language}/enterprise`} className="text-white/50 hover:text-accent transition-colors">B2B</Link>
            <Link href="/app/auth" className="text-accent hover:text-accent/80 transition-colors font-semibold">Console</Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
