"use client";

import { use } from "react";
import Link from "next/link";
import { MarketingLayout, useReveal } from "@/components/marketing/MarketingLayout";
import { PUBLIC_PLAN_COPY } from "@/i18n";

export default function Page(props: { params: Promise<{ locale: string }> }) {
  const params = use(props.params);
  const language = params.locale as "ru" | "en";
  const planCopy = PUBLIC_PLAN_COPY[language];
  const devCopy = planCopy.developer;
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
          <span className="lend-section-kicker lend-reveal--1">{devCopy.badge}</span>
          <h1 className="lend-reveal--2">{devCopy.title}</h1>
          <p className="lend-reveal--3">{devCopy.body}</p>
          <div className="lend-cta-row lend-reveal--4">
            <Link className="lend-primary" href="/app/auth">
              {planCopy.auth}
            </Link>
          </div>
        </div>
      </section>

      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-overview-grid lend-reveal--2">
          {devCopy.features.map((feature) => (
            <article key={feature.title} className="lend-card lend-spotlight-card" onMouseMove={handleMouseMove}>
              <div className="lend-card-spotlight" />
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lend-stacked-section lend-reveal--3" ref={reveal}>
        <div className="lend-terminal-container">
           <div className="lend-terminal-header">
              <span /> <span /> <span />
              <label>API Example</label>
           </div>
           <pre className="lend-terminal-body">
              <code>{devCopy.code}</code>
           </pre>
        </div>
      </section>

      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-section-header">
           <h2 className="lend-reveal--1">Integration Flow</h2>
        </div>
        <div className="lend-flow-grid lend-reveal--2">
          {devCopy.flow.map((step, idx) => (
            <div key={step.title} className="lend-flow-item">
               <div className="lend-flow-number">{idx + 1}</div>
               <h3>{step.title}</h3>
               <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
