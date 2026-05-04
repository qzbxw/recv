import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
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

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <header className="page-header">
          <span className="lend-section-kicker">
            {copy.useCasesHub.kicker}
          </span>
          <h1 className="page-title font-extrabold tracking-tight" style={{ marginTop: "1rem" }}>
            {copy.useCasesHub.title}
          </h1>
          <p className="page-subtitle font-medium" style={{ margin: "0" }}>
            {copy.useCasesHub.description}
          </p>
        </header>

        <section className="benefits-grid page-section">
          {useCases.map((uc) => (
            <Link key={uc.slug} href={`/${locale}/use-cases/${uc.slug}`} className="lend-card benefit-card hover:border-purple-500/50 transition-colors">
              <h3 className="benefit-title font-bold">{uc.title}</h3>
              <p className="benefit-text font-medium">
                {locale === "ru" 
                  ? `Узнайте, как ${uc.title} используют инфраструктуру Reqst для автоматизации крипто-платежей.`
                  : `Explore how ${uc.title} leverage Reqst infrastructure for automated crypto processing.`
                }
              </p>
              <span className="lend-secondary" style={{ marginTop: "auto", fontSize: "0.9rem" }}>
                {locale === "ru" ? "Изучить кейс →" : "Read use case →"}
              </span>
            </Link>
          ))}
        </section>

        <section className="page-final-section">
          <h2 className="page-final-title font-bold">{copy.useCasesHub.customUseCase.title}</h2>
          <p className="page-final-text font-medium">
            {copy.useCasesHub.customUseCase.body}
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
