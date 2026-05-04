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
  const lang = locale as "en" | "ru";
  const copy = PUBLIC_MARKETING_COPY[lang];
  
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.breadcrumbs.products, href: `/${locale}/products` },
  ];

  return (
    <MarketingLayout language={lang}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
      </div>
      
      <header className="lend-hero lend-hero--centered pb-20">
        <div className="lend-hero-copy">
          <span className="lend-section-kicker">
            {copy.productsHub.kicker}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6 tracking-tight">
            {copy.productsHub.title}
          </h1>
          <p className="text-xl opacity-70 max-w-2xl mx-auto leading-relaxed">
            {copy.productsHub.description}
          </p>
        </div>
      </header>

      <section className="lend-stacked-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article className="lend-card flex flex-col p-10 group hover:border-blue-500/30 transition-colors">
            <h3 className="text-2xl font-bold mb-4">{copy.productsHub.checkout.title}</h3>
            <p className="opacity-70 leading-relaxed mb-8">{copy.productsHub.checkout.desc}</p>
            <Link href={`/${locale}/products/checkout`} className="lend-secondary mt-auto self-start bg-white/5 hover:bg-white/10 px-6 py-2 rounded-lg text-sm font-bold">
              {copy.productsHub.checkout.link}
            </Link>
          </article>

          <article className="lend-card flex flex-col p-10 group hover:border-blue-500/30 transition-colors">
            <h3 className="text-2xl font-bold mb-4">{copy.productsHub.api.title}</h3>
            <p className="opacity-70 leading-relaxed mb-8">{copy.productsHub.api.desc}</p>
            <Link href={`/${locale}/products/api`} className="lend-secondary mt-auto self-start bg-white/5 hover:bg-white/10 px-6 py-2 rounded-lg text-sm font-bold">
              {copy.productsHub.api.link}
            </Link>
          </article>

          <article className="lend-card flex flex-col p-10 group hover:border-blue-500/30 transition-colors">
            <h3 className="text-2xl font-bold mb-4">{copy.productsHub.invoicing.title}</h3>
            <p className="opacity-70 leading-relaxed mb-8">{copy.productsHub.invoicing.desc}</p>
            <Link href={`/${locale}/products/invoicing`} className="lend-secondary mt-auto self-start bg-white/5 hover:bg-white/10 px-6 py-2 rounded-lg text-sm font-bold">
              {copy.productsHub.invoicing.link}
            </Link>
          </article>
        </div>
      </section>

      <footer className="lend-final pb-32">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">{copy.final.title}</h2>
        <p className="text-xl opacity-70 max-w-2xl mx-auto mb-12 leading-relaxed">
          {copy.final.body}
        </p>
        <div className="lend-cta-row">
          <Link href="/app/auth" className="lend-primary">{copy.final.primary}</Link>
          <Link href={`/${locale}/pricing`} className="lend-secondary">{copy.nav.pricing.title}</Link>
        </div>
      </footer>
    </MarketingLayout>
  );
}
