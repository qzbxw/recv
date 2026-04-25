"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "./UIProvider";
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
  operatorName: "[Укажи юрлицо / ИП / физлицо-оператора]",
  contactEmail: "legal@your-domain.tld",
  supportEmail: "support@your-domain.tld",
  address: "[Укажи юридический адрес / адрес для уведомлений]",
  jurisdiction: "[Укажи страну и применимое право]",
  domain: "[Укажи основной домен сервиса]",
  refundPolicy: "[Опиши правила возврата или явно укажи no refunds]",
  effectiveDate: {
    ru: "13 марта 2026",
    en: "March 13, 2026",
  },
} as const;const legalCopy = COPY as unknown as Record<LegalVariant, Record<"ru" | "en", LegalCopy>>;
legalCopy.privacy.en.sections = legalCopy.privacy.ru.sections;
legalCopy.terms.en.sections = legalCopy.terms.ru.sections;

export function LegalPage({ variant }: { variant: LegalVariant }) {
  const { language } = useUI();
  const pathname = usePathname();
  const copy = legalCopy[variant][language];

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  return (
    <main className="legal-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell lend-shell--legal">
        <header className="legal-topbar">
          <Link className="lend-brand" href={`/${language}`}>
            <strong>reqst</strong>
          </Link>

          <div className="lend-topbar-actions">
            <div className="lend-language" role="group" aria-label="language switcher">
              <Link 
                href={pathname.startsWith("/ru") ? pathname.replace("/ru", "/en") : pathname.replace("/en", "/ru")}
                className="inactive"
              >
                {language === "ru" ? "EN" : "RU"}
              </Link>
            </div>
            <Link className="lend-nav-link" href={`/${language}`}>
              /home
            </Link>
            <Link className="lend-primary" href="/app/auth">
              Auth
            </Link>
          </div>
        </header>

        <section className="legal-hero legal-fade legal-fade--1">
          <span className="lend-section-kicker">{copy.kicker}</span>
          <h1>{copy.title}</h1>
          <p>{copy.summary}</p>

          {copy.leadTitle || copy.leadParagraphs ? (
            <div className="legal-lead">
              {copy.leadTitle ? <h2>{copy.leadTitle}</h2> : null}
              {copy.leadParagraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ) : null}

          <div className="legal-meta">
            {copy.metaItems ? (
              copy.metaItems.map((item) => <span key={item}>{item}</span>)
            ) : (
              <>
                <span>
                  {copy.updatedLabel}: {LEGAL_PROFILE.effectiveDate[language]}
                </span>
                <span>
                  {copy.operatorLabel}: {LEGAL_PROFILE.operatorName}
                </span>
              </>
            )}
          </div>
        </section>

        <section className="legal-note legal-fade legal-fade--2">
          <div>
            <h2>{copy.draftTitle}</h2>
            <p>{copy.draftBody}</p>
          </div>

          <ul className="legal-token-list">
            {copy.draftItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="legal-sections">
          {copy.sections.map((section, index) => (
            <article key={section.title} className={`legal-card legal-fade legal-fade--${(index % 4) + 1}`}>
              <div className="legal-card-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="legal-card-copy">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="legal-bullet-list">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <footer className="lend-footer lend-footer--legal">
          <p>{copy.footerNote}</p>
          <div className="lend-footer-links">
            <Link href={`/${language}/privacy`}>Privacy</Link>
            <Link href={`/${language}/terms`}>Terms</Link>
            <Link href={`/${language}/docs/introduction`}>Docs</Link>
            <Link href={`/${language}/dev`}>API</Link>
            <Link href={`/${language}/enterprise`}>B2B</Link>
            <Link href="/app/auth">Console</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
