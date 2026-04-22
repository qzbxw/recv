"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MarketingLayout, useReveal } from "./marketing/MarketingLayout";
import { useUI } from "./UIProvider";
import { JsonLd } from "./JsonLd";
import { PUBLIC_MARKETING_COPY, PUBLIC_PLAN_COPY as COPY } from "@/i18n";

export type Variant = "merchant" | "developer" | "business" | "enterprise";export function PlanPage({ variant }: { variant: Variant }) {
  const { language } = useUI();
  const text = COPY[language];
  const marketing = PUBLIC_MARKETING_COPY[language];
  const product = text[variant];
  const reveal = useReveal();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [variant]);

  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": product.badge,
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": variant === "merchant" ? "39.00" : variant === "developer" ? "199.00" : variant === "business" ? "499.00" : "0.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <MarketingLayout language={language}>
        <JsonLd schema={applicationSchema} />
        <section className="lend-hero lend-hero--centered" ref={reveal}>
          <div className="lend-hero-copy">
            <span className="lend-section-kicker lend-reveal--1">{product.badge}</span>
            <h1 className="lend-reveal--2">{product.title}</h1>
            <p className="lend-reveal--3">{product.body}</p>

            <div className="lend-cta-row lend-reveal--4">
              {variant === "enterprise" ? (
                <a className="lend-primary" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                  {text.discuss}
                </a>
              ) : (
                <Link className="lend-primary" href="/app/auth">
                  {marketing.activate}
                </Link>
              )}
              <Link className="lend-secondary" href="/app/auth">
                {text.auth}
              </Link>
            </div>
          </div>
        </section>

        <section className="lend-split-section lend-plan-features" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.compareTitle}</span>
            <h2>{text.compareSectionTitle}</h2>
            <p>{text.compareSectionBody}</p>
            <div className="lend-stats-grid" style={{ marginTop: "2rem" }}>
                {product.stats.map((stat, i) => (
                  <article key={i} className={`lend-card lend-stat-card lend-reveal--${2 + i}`}>
                    <span className="lend-stat-label">{stat.label}</span>
                    <h3 className="lend-stat-value">{stat.value}</h3>
                  </article>
                ))}
            </div>
          </div>

          <div className="lend-overview-grid lend-reveal--2">
            {product.features.map((feat, i) => (
              <article key={i} className={`lend-card lend-plan-feature-card lend-reveal--${2 + i}`}>
                <h3>{feat.title}</h3>
                <p>{feat.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-stacked-section lend-code-section" ref={reveal}>
           <div className="lend-card lend-code-card lend-reveal--1">
              <div className="lend-code-grid">
                <div className="lend-reveal--2">
                  <span className="lend-section-kicker">{text.codeTitle}</span>
                  <h2>{text.codeSubtitle}</h2>
                  <p>{text.codeBody}</p>
                </div>
                <div className="lend-reveal--3 lend-code-block">
                  <pre>
                    <code>{product.code}</code>
                  </pre>
                </div>
              </div>
           </div>
        </section>

        <section className="lend-stacked-section lend-flow-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.flowTitle}</span>
            <h2>{marketing.seamlessFlow}</h2>
          </div>

          <div className="lend-flow-container">
            {product.flow.map((step, i) => (
              <article key={i} className={`lend-card lend-flow-card lend-reveal--${2 + i}`}>
                <div className="lend-flow-step-number">{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {i < 2 && <div className="lend-flow-arrow">→</div>}
              </article>
            ))}
          </div>
        </section>

        <section className="lend-final lend-plan-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{text.priceTitle}</span>
          </div>
          <div className="lend-reveal--2">
            <h2 className="lend-price-value">{product.priceLabel}</h2>
          </div>
          <div className="lend-reveal--3">
            <p className="lend-price-period">{product.period}</p>
            <p className="lend-price-subtitle">{text.priceSubtitle}</p>
          </div>

          <div className="lend-cta-row lend-reveal--4">
            {variant === "enterprise" ? (
              <a className="lend-primary lend-price-btn" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                {text.discuss}
              </a>
            ) : (
              <Link className="lend-primary lend-price-btn" href="/app/auth">
                {marketing.activateVerb} {product.badge}
              </Link>
            )}
          </div>
        </section>
    </MarketingLayout>
  );
}
