import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { PUBLIC_MARKETING_COPY } from "@/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];

  return {
    title: `${copy.compareHub.title} | Reqst`,
    description: copy.compareHub.description,
    alternates: {
      canonical: `/${locale}/compare`,
    },
  };
}

export default async function CompareHubPage(props: Props) {
  const { locale } = await props.params;
  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];
  
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.breadcrumbs.compare, href: `/${locale}/compare` },
  ];

  const comparisons = [
    { title: "Reqst vs Manual Verification", slug: "reqst-vs-manual" },
    { title: "Reqst vs Custodial Gateways", slug: "reqst-vs-custodial" },
    { title: "Reqst vs NowPayments", slug: "nowpayments" },
  ];

  const kickerStyle = { color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header className="page-header">
          <span style={kickerStyle}>
            {copy.compareHub.kicker}
          </span>
          <h1 className="page-title" style={{ marginTop: "1rem" }}>
            {copy.compareHub.title}
          </h1>
          <p className="page-subtitle" style={{ margin: "0" }}>
            {copy.compareHub.description}
          </p>
        </header>

        <section className="benefits-grid page-section">
          {comparisons.map((comp) => (
            <Link key={comp.slug} href={`/${locale}/compare/${comp.slug}`} className="lend-card benefit-card hover:border-purple-500/50 transition-colors">
              <h3 className="benefit-title">{comp.title}</h3>
              <p className="benefit-text">
                A detailed breakdown of why {comp.title.split(' vs ')[1] || "alternative solutions"} fall short compared to Reqst.
              </p>
              <span className="lend-secondary" style={{ marginTop: "auto", fontSize: "0.9rem" }}>See comparison →</span>
            </Link>
          ))}
        </section>

        <section className="page-final-section">
          <h2 className="page-final-title">Efficiency by Default</h2>
          <p className="page-final-text">
            Reqst was built to solve the real problems merchants face every day. Stop wasting time and money on outdated solutions.
          </p>
          <div className="page-cta-row page-cta-row--centered">
            <Link href="/app/auth" className="lend-primary">{copy.final.primary}</Link>
            <Link href={`/${locale}/pricing`} className="lend-secondary">{copy.nav.pricing.title}</Link>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
