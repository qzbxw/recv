import { MarketingLayout } from "./MarketingLayout";
import Link from "next/link";
import { PUBLIC_MARKETING_COPY } from "@/i18n";

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
  const copy = PUBLIC_MARKETING_COPY[language];


  return (
    <MarketingLayout language={language}>
      <section className="lend-hero lend-hero--centered is-revealed">
        <div className="lend-hero-copy">
          <span className="lend-section-kicker lend-reveal--1">
            {copy.useCases}
          </span>
          <h1 className="lend-reveal--2">{useCase.title}</h1>
          <p className="lend-reveal--3">{useCase.description}</p>
          <div className="lend-cta-row lend-reveal--4">
            <Link className="lend-primary" href="/app/auth">
              {copy.startIntegration}
            </Link>
            <Link className="lend-secondary" href={`/${language}/docs/introduction`}>
              {copy.docs}
            </Link>
          </div>
        </div>
      </section>

      <section className="lend-stacked-section" data-reveal>
        <div className="lend-overview-grid lend-reveal--2">
          {useCase.points.map((point, i) => (
            <article key={i} className="lend-card lend-spotlight-card">
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
