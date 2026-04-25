"use client";

import { use } from "react";
import Link from "next/link";
import { MarketingLayout, useReveal } from "@/components/marketing/MarketingLayout";
import { PUBLIC_MARKETING_COPY } from "@/i18n";

export default function Page(props: { params: Promise<{ locale: string }> }) {
  const params = use(props.params);
  const language = params.locale as "ru" | "en";
  const copy = PUBLIC_MARKETING_COPY[language];
  const reveal = useReveal();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <MarketingLayout language={language}>
      <section className="lend-hero lend-hero--centered" ref={reveal}>
        <div className="lend-hero-copy">
          <span className="lend-section-kicker lend-reveal--1">{copy.checkoutProduct.kicker}</span>
          <h1 className="lend-reveal--2">{copy.checkoutProduct.title}</h1>
          <p className="lend-reveal--3">{copy.checkoutProduct.description}</p>
          <div className="lend-cta-row lend-reveal--4">
            <Link className="lend-primary" href="/app/auth">
              {copy.tryDemo}
            </Link>
            <Link className="lend-secondary" href={`/${language}/docs/introduction`}>
              {copy.docs}
            </Link>
          </div>
        </div>
      </section>

      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-overview-grid lend-reveal--2">
          {copy.checkoutProduct.cards.map((card) => (
            <article key={card.title} className="lend-card lend-spotlight-card" onMouseMove={handleMouseMove}>
              <div className="lend-card-spotlight" />
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
