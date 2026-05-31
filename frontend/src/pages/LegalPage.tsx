import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";
import { LEGAL_COPY as COPY } from "../i18n";

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
  const { language, setLanguage } = useUI();
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
          <Link className="lend-brand" to="/lend">
            <strong>reqst</strong>
          </Link>

          <div className="lend-topbar-actions">
            <div className="lend-language" role="group" aria-label="language switcher">
              <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>
                RU
              </button>
              <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
                EN
              </button>
            </div>
            <Link className="lend-nav-link" to="/lend">
              /lend
            </Link>
            <Link className="lend-primary" to="/auth">
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
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/developers">Docs</Link>
            <Link to="/dev">API</Link>
            <Link to="/enterprise">B2B</Link>
            <Link to="/auth">Console</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
