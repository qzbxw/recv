import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { getCopy, normalizeLocale, type Locale } from "@/i18n";

type Props = {
  params: Promise<{ network: string; locale: string }>;
};

type NetworkSlug = keyof ReturnType<typeof getCopy>["marketing"]["networkPages"];

const NETWORK_SLUGS = [
  "ton",
  "tron",
  "solana",
  "base",
  "bsc",
  "arbitrum",
] as const satisfies readonly NetworkSlug[];

function isNetworkSlug(value: string): value is NetworkSlug {
  return NETWORK_SLUGS.includes(value as NetworkSlug);
}

function localizedHref(locale: Locale, path: string) {
  if (path.startsWith("/app/")) return path;
  return `/${locale}${path}`;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { network, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (!isNetworkSlug(network)) return { title: "Network Not Found" };

  const page = getCopy(locale).marketing.networkPages[network];

  return {
    title: `${page.metadata.title} | Reqst`,
    description: page.metadata.description,
    alternates: {
      canonical: `/${locale}/networks/${network}`,
    },
    openGraph: {
      title: page.metadata.title,
      description: page.metadata.description,
    },
  };
}

export default async function NetworkPage(props: Props) {
  const { network, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (!isNetworkSlug(network)) notFound();

  const copy = getCopy(locale);
  const page = copy.marketing.networkPages[network];
  const breadcrumbs = [
    { label: copy.marketing.breadcrumbs.home, href: `/${locale}` },
    { label: copy.marketing.breadcrumbs.networks, href: `/${locale}/networks` },
    { label: page.name, href: `/${locale}/networks/${network}` },
  ];

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Reqst ${page.name} Gateway`,
    operatingSystem: "Web",
    applicationCategory: "PaymentApplication",
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
              <Link href={localizedHref(locale, page.cta.primary.href)} className="lend-primary">
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

        <section className="use-case-network-section page-section">
          <div className="use-case-section-copy">
            <span className="lend-section-kicker">{page.assets.kicker}</span>
            <h2>{page.assets.title}</h2>
            <p>{page.assets.body}</p>
          </div>
          <div className="use-case-network-grid">
            {page.assets.items.map((asset) => (
              <article key={asset.name} className="use-case-network">
                <strong>{asset.name}</strong>
                <span>{asset.body}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="use-case-narrative page-section">
          <article>
            <span>{page.why.kicker}</span>
            <h2>{page.why.title}</h2>
            <p>{page.why.body}</p>
          </article>
          <article>
            <span>{page.limitations.kicker}</span>
            <h2>{page.limitations.title}</h2>
            <p>{page.limitations.body}</p>
          </article>
        </section>

        <section className="use-case-flow page-section">
          <div className="use-case-section-copy">
            <span className="lend-section-kicker">{page.mechanics.kicker}</span>
            <h2>{page.mechanics.title}</h2>
          </div>
          <div className="use-case-flow__steps">
            {page.mechanics.steps.map((step, index) => (
              <article key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="use-case-network-section page-section">
          <div className="use-case-section-copy">
            <span className="lend-section-kicker">{page.useCases.kicker}</span>
            <h2>{page.useCases.title}</h2>
            <p>{page.useCases.body}</p>
          </div>
          <div className="use-case-network-grid">
            {page.useCases.items.map((item) => (
              <article key={item.name} className="use-case-network">
                <strong>{item.name}</strong>
                <span>{item.body}</span>
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
            <Link href={localizedHref(locale, page.cta.primary.href)} className="lend-primary">
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
