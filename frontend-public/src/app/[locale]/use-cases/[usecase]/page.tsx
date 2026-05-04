import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { getCopy, normalizeLocale, type Locale } from "@/i18n";

type Props = {
  params: Promise<{ usecase: string; locale: string }>;
};

type UseCaseSlug = keyof ReturnType<typeof getCopy>["marketing"]["useCasePages"];

const USE_CASE_SLUGS = [
  "telegram-shops",
  "saas-billing",
  "digital-goods",
  "paid-communities",
] as const satisfies readonly UseCaseSlug[];

function isUseCaseSlug(value: string): value is UseCaseSlug {
  return USE_CASE_SLUGS.includes(value as UseCaseSlug);
}

function localizedHref(locale: Locale, path: string) {
  if (path.startsWith("/app/")) return path;
  return `/${locale}${path}`;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { usecase, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (!isUseCaseSlug(usecase)) return { title: "Use Case Not Found" };

  const page = getCopy(locale).marketing.useCasePages[usecase];

  return {
    title: `${page.metadata.title} | Reqst`,
    description: page.metadata.description,
    alternates: {
      canonical: `/${locale}/use-cases/${usecase}`,
    },
    openGraph: {
      title: page.metadata.title,
      description: page.metadata.description,
    },
  };
}

export default async function UseCasePage(props: Props) {
  const { usecase, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (!isUseCaseSlug(usecase)) notFound();

  const copy = getCopy(locale);
  const page = copy.marketing.useCasePages[usecase];
  const breadcrumbs = [
    { label: copy.marketing.breadcrumbs.home, href: `/${locale}` },
    { label: copy.marketing.breadcrumbs.useCases, href: `/${locale}/use-cases` },
    { label: page.name, href: `/${locale}/use-cases/${usecase}` },
  ];

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Reqst ${page.name}`,
    applicationCategory: "PaymentApplication",
    operatingSystem: "Web",
    description: page.metadata.description,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <MarketingLayout language={locale}>
      <JsonLd schema={softwareSchema} />
      <div className="page-container use-case-page">
        <Breadcrumbs items={breadcrumbs} locale={locale} />

        <header className="use-case-hero">
          <div className="use-case-hero__copy">
            <span className="lend-section-kicker">{page.kicker}</span>
            <h1 className="page-title">{page.hero.title}</h1>
            <p className="page-subtitle">{page.hero.body}</p>
            <div className="page-cta-row">
              <Link href={page.cta.primary.href} className="lend-primary">
                {page.cta.primary.label}
              </Link>
              <Link href={localizedHref(locale, page.cta.secondary.href)} className="lend-secondary">
                {page.cta.secondary.label}
              </Link>
            </div>
          </div>

          <aside className="use-case-hero__surface" aria-label={page.snapshot.title}>
            <span>{page.snapshot.kicker}</span>
            <h2>{page.snapshot.title}</h2>
            <div className="use-case-snapshot__amount">{page.snapshot.amount}</div>
            <div className="use-case-snapshot__meta">
              {page.snapshot.items.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </header>

        <section className="use-case-narrative page-section">
          <article>
            <span>{page.problem.kicker}</span>
            <h2>{page.problem.title}</h2>
            <p>{page.problem.body}</p>
          </article>
          <article>
            <span>{page.solution.kicker}</span>
            <h2>{page.solution.title}</h2>
            <p>{page.solution.body}</p>
          </article>
        </section>

        <section className="use-case-product page-section">
          <div className="use-case-section-copy">
            <span className="lend-section-kicker">{page.productPlan.kicker}</span>
            <h2>{page.productPlan.title}</h2>
            <p>{page.productPlan.body}</p>
          </div>
          <div className="use-case-product__grid">
            <article className="lend-card use-case-detail-card">
              <span>{page.productPlan.product.label}</span>
              <h3>{page.productPlan.product.title}</h3>
              <p>{page.productPlan.product.body}</p>
              <Link href={localizedHref(locale, page.productPlan.product.href)} className="use-case-inline-link">
                {page.productPlan.product.linkLabel}
              </Link>
            </article>
            <article className="lend-card use-case-detail-card">
              <span>{page.productPlan.plan.label}</span>
              <h3>{page.productPlan.plan.title}</h3>
              <p>{page.productPlan.plan.body}</p>
              <Link href={localizedHref(locale, page.productPlan.plan.href)} className="use-case-inline-link">
                {page.productPlan.plan.linkLabel}
              </Link>
            </article>
          </div>
        </section>

        <section className="use-case-network-section page-section">
          <div className="use-case-section-copy">
            <span className="lend-section-kicker">{page.networks.kicker}</span>
            <h2>{page.networks.title}</h2>
            <p>{page.networks.body}</p>
          </div>
          <div className="use-case-network-grid">
            {page.networks.items.map((network) => (
              <article key={network.name} className="use-case-network">
                <strong>{network.name}</strong>
                <span>{network.body}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="use-case-flow page-section">
          <div className="use-case-section-copy">
            <span className="lend-section-kicker">{page.flow.kicker}</span>
            <h2>{page.flow.title}</h2>
          </div>
          <div className="use-case-flow__steps">
            {page.flow.steps.map((step, index) => (
              <article key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="use-case-related page-section">
          <div className="use-case-section-copy">
            <span className="lend-section-kicker">{page.related.kicker}</span>
            <h2>{page.related.title}</h2>
          </div>
          <div className="use-case-related__grid">
            {page.related.links.map((link) => (
              <Link key={link.href} href={localizedHref(locale, link.href)} className="lend-card use-case-related-link">
                <span>{link.kicker}</span>
                <strong>{link.label}</strong>
                <p>{link.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="page-final-section use-case-final">
          <h2 className="page-final-title">{page.cta.title}</h2>
          <p className="page-final-text page-final-text--wide">{page.cta.body}</p>
          <div className="page-cta-row page-cta-row--centered">
            <Link href={page.cta.primary.href} className="lend-primary">
              {page.cta.primary.label}
            </Link>
            <Link href={localizedHref(locale, page.cta.secondary.href)} className="lend-secondary">
              {page.cta.secondary.label}
            </Link>
          </div>
        </section>

        <section className="use-case-seo" aria-label={page.seoLabel}>
          <p>{page.seo}</p>
        </section>
      </div>
    </MarketingLayout>
  );
}
