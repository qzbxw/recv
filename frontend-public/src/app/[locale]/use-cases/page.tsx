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
    title: `${copy.useCasesHub.title} | Reqst`,
    description: copy.useCasesHub.description,
    alternates: {
      canonical: `/${locale}/use-cases`,
    },
  };
}

export default async function UseCasesHubPage(props: Props) {
  const { locale } = await props.params;
  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];
  
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.breadcrumbs.useCases, href: `/${locale}/use-cases` },
  ];

  const useCases = [
    { title: copy.nav.useCases.tgShops, slug: "telegram-shops" },
    { title: copy.nav.useCases.saas, slug: "saas-billing" },
    { title: copy.nav.useCases.digital, slug: "digital-goods" },
    { title: copy.nav.useCases.communities, slug: "paid-communities" },
  ];

  const kickerStyle = { color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header className="page-header">
          <span style={kickerStyle}>
            {copy.useCasesHub.kicker}
          </span>
          <h1 className="page-title" style={{ marginTop: "1rem" }}>
            {copy.useCasesHub.title}
          </h1>
          <p className="page-subtitle" style={{ margin: "0" }}>
            {copy.useCasesHub.description}
          </p>
        </header>

        <section className="benefits-grid page-section">
          {useCases.map((uc) => (
            <Link key={uc.slug} href={`/${locale}/use-cases/${uc.slug}`} className="lend-card benefit-card hover:border-purple-500/50 transition-colors">
              <h3 className="benefit-title">{uc.title}</h3>
              <p className="benefit-text">
                Explore how {uc.title} leverage Reqst infrastructure for automated crypto processing.
              </p>
              <span className="lend-secondary" style={{ marginTop: "auto", fontSize: "0.9rem" }}>Read use case →</span>
            </Link>
          ))}
        </section>

        <section className="page-final-section">
          <h2 className="page-final-title">Have a unique use case?</h2>
          <p className="page-final-text">
            Our API is flexible enough to power any payment flow. Let&apos;s discuss how Reqst can help your specific business.
          </p>
          <div className="page-cta-row page-cta-row--centered">
            <Link href="/app/auth" className="lend-primary">{copy.final.primary}</Link>
            <Link href={`/${locale}/enterprise`} className="lend-secondary">{copy.nav.pricing.enterprise}</Link>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
