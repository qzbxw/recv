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
    title: `${copy.productsHub.title} | Reqst`,
    description: copy.productsHub.description,
    alternates: {
      canonical: `/${locale}/products`,
    },
  };
}

export default async function ProductsHubPage(props: Props) {
  const { locale } = await props.params;
  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];
  
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.breadcrumbs.products, href: `/${locale}/products` },
  ];

  const kickerStyle = { color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header className="page-header">
          <span style={kickerStyle}>
            {copy.productsHub.kicker}
          </span>
          <h1 className="page-title" style={{ marginTop: "1rem" }}>
            {copy.productsHub.title}
          </h1>
          <p className="page-subtitle" style={{ margin: "0" }}>
            {copy.productsHub.description}
          </p>
        </header>

        <section className="benefits-grid page-section">
          <article className="lend-card benefit-card">
            <h3 className="benefit-title">{copy.productsHub.checkout.title}</h3>
            <p className="benefit-text">{copy.productsHub.checkout.desc}</p>
            <Link href={`/${locale}/products/checkout`} className="lend-secondary" style={{ marginTop: "auto", alignSelf: "flex-start" }}>
              {copy.productsHub.checkout.link}
            </Link>
          </article>

          <article className="lend-card benefit-card">
            <h3 className="benefit-title">{copy.productsHub.api.title}</h3>
            <p className="benefit-text">{copy.productsHub.api.desc}</p>
            <Link href={`/${locale}/products/api`} className="lend-secondary" style={{ marginTop: "auto", alignSelf: "flex-start" }}>
              {copy.productsHub.api.link}
            </Link>
          </article>

          <article className="lend-card benefit-card">
            <h3 className="benefit-title">{copy.productsHub.invoicing.title}</h3>
            <p className="benefit-text">{copy.productsHub.invoicing.desc}</p>
            <Link href={`/${locale}/products/invoicing`} className="lend-secondary" style={{ marginTop: "auto", alignSelf: "flex-start" }}>
              {copy.productsHub.invoicing.link}
            </Link>
          </article>
        </section>

        <section className="page-final-section">
          <h2 className="page-final-title">{copy.final.title}</h2>
          <p className="page-final-text">
            {copy.final.body}
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
