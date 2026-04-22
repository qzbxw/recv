"use client";

import { MarketingLayout, useReveal } from "./MarketingLayout";
import Link from "next/link";

export type UseCaseInfo = {
  title: string;
  description: string;
  points: { title: string; body: string }[];
};

export function UseCasePageTemplate({
  language,
  useCase,
}: {
  language: "ru" | "en";
  useCase: UseCaseInfo;
}) {
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
          <span className="lend-section-kicker lend-reveal--1">
            {language === "ru" ? "КЕЙСЫ" : "USE CASES"}
          </span>
          <h1 className="lend-reveal--2">{useCase.title}</h1>
          <p className="lend-reveal--3">{useCase.description}</p>
          <div className="lend-cta-row lend-reveal--4">
            <Link className="lend-primary" href="/app/auth">
              {language === "ru" ? "Начать внедрение" : "Start Integration"}
            </Link>
            <Link className="lend-secondary" href="/docs">
              {language === "ru" ? "Документация" : "Documentation"}
            </Link>
          </div>
        </div>
      </section>

      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-overview-grid lend-reveal--2">
          {useCase.points.map((point, i) => (
            <article key={i} className="lend-card lend-spotlight-card" onMouseMove={handleMouseMove}>
              <div className="lend-card-spotlight" />
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
