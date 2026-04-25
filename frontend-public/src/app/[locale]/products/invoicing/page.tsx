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
    title: `${copy.invoicingProduct.title} | Reqst`,
    description: copy.invoicingProduct.description,
    alternates: {
      canonical: `/${locale}/products/invoicing`,
    },
  };
}

export default async function InvoicingProductPage(props: Props) {
  const { locale } = await props.params;
  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];
  
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.breadcrumbs.products, href: `/${locale}/products` },
    { label: copy.breadcrumbs.invoicing, href: `/${locale}/products/invoicing` },
  ];

  const kickerStyle = { color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header className="page-header">
          <span style={kickerStyle}>
            {copy.invoicingProduct.kicker}
          </span>
          <h1 className="page-title" style={{ marginTop: "1rem" }}>
            {copy.invoicingProduct.title}
          </h1>
          <p className="page-subtitle" style={{ margin: "0" }}>
            {copy.invoicingProduct.description}
          </p>
          
          <div className="page-cta-row">
            <Link href="/app/auth" className="lend-primary">{copy.hero.primary}</Link>
            <Link href={`/${locale}/products/checkout`} className="lend-secondary">Checkout UI</Link>
          </div>
        </header>

        <section className="benefits-grid page-section">
          {copy.invoicingProduct.cards.map((card, i) => (
            <div key={i} className="lend-card benefit-card">
              <div className="benefit-check">✓</div>
              <h3 className="benefit-title">{card.title}</h3>
              <p className="benefit-text">{card.body}</p>
            </div>
          ))}
        </section>

        <section className="page-final-section">
          <h2 className="page-final-title">Billing Simplified</h2>
          <p className="page-final-text">
            Join the modern era of crypto commerce with Reqst Invoicing. Non-custodial, automated, and professional.
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
