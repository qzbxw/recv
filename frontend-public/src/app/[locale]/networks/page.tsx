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
    title: `${copy.networksHub.title} | Reqst`,
    description: copy.networksHub.description,
    alternates: {
      canonical: `/${locale}/networks`,
    },
  };
}

export default async function NetworksHubPage(props: Props) {
  const { locale } = await props.params;
  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];
  
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.breadcrumbs.networks, href: `/${locale}/networks` },
  ];

  const networks = [
    { id: "ton", name: copy.nav.networks.ton, slug: "ton", desc: locale === "ru" ? "TON и Jettons для Telegram-native платежных сценариев." : "TON and Jettons for Telegram-native payment flows." },
    { id: "tron", name: copy.nav.networks.tron, slug: "tron", desc: locale === "ru" ? "USDT TRC-20 для привычных stablecoin-переводов." : "USDT TRC-20 for familiar stablecoin transfers." },
    { id: "solana", name: copy.nav.networks.solana, slug: "solana", desc: locale === "ru" ? "SOL и SPL tokens для быстрых web3-платежей." : "SOL and SPL tokens for fast web3 payments." },
    { id: "base", name: copy.nav.networks.base, slug: "base", desc: locale === "ru" ? "Base L2 для EVM-покупателей и low-cost checkout." : "Base L2 for EVM buyers and low-cost checkout." },
    { id: "bsc", name: copy.nav.networks.bsc, slug: "bsc", desc: locale === "ru" ? "BEP-20 активы для широкой retail-аудитории." : "BEP-20 assets for broad retail audiences." },
    { id: "arbitrum", name: copy.nav.networks.arbitrum, slug: "arbitrum", desc: locale === "ru" ? "Arbitrum One для Ethereum-aligned платежей с меньшими fees." : "Arbitrum One for Ethereum-aligned payments with lower fees." },
  ];

  const kickerStyle = { color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header className="page-header">
          <span style={kickerStyle}>
            {copy.networksHub.kicker}
          </span>
          <h1 className="page-title" style={{ marginTop: "1rem" }}>
            {copy.networksHub.title}
          </h1>
          <p className="page-subtitle" style={{ margin: "0" }}>
            {copy.networksHub.description}
          </p>
        </header>

        <section className="benefits-grid page-section">
          {networks.map((network) => (
            <Link key={network.id} href={`/${locale}/networks/${network.slug}`} className="lend-card benefit-card hover:border-purple-500/50 transition-colors">
              <h3 className="benefit-title">{network.name}</h3>
              <p className="benefit-text">
                {network.desc}
              </p>
              <span className="lend-secondary" style={{ marginTop: "auto", fontSize: "0.9rem" }}>
                {locale === "ru" ? "Подробнее о сети" : "View network details"} →
              </span>
            </Link>
          ))}
        </section>

        <section className="page-final-section">
          <h2 className="page-final-title">Non-Custodial by Design</h2>
          <p className="page-final-text">
            {copy.networksHub.explanation}
          </p>
          <div className="page-cta-row page-cta-row--centered">
            <Link href="/app/auth" className="lend-primary">{copy.final.primary}</Link>
            <Link href={`/${locale}/dev`} className="lend-secondary">{copy.nav.docs}</Link>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
