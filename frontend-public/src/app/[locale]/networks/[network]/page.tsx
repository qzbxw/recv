import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import Link from "next/link";

const NETWORKS = {
  ton: {
    name: "TON",
    fullName: "The Open Network",
    title: "Accept TON Payments Directly to Your Wallet",
    description: "Scale your business with lightning-fast TON payments. Zero-commission processing, non-custodial architecture, and instant payouts.",
    features: [
      "Native TON & Jettons support",
      "Instant transaction detection",
      "Deep Telegram integration",
      "Non-custodial Direct-to-Wallet"
    ]
  },
  tron: {
    name: "TRON",
    fullName: "TRON Network",
    title: "Accept TRON USDT Payments with Fixed Fees",
    description: "The most popular network for USDT payments. Reqst provides high-performance TRON monitoring without percentage-based fees.",
    features: [
      "USDT (TRC-20) support",
      "Energy-efficient processing",
      "High throughput reliability",
      "No intermediary accounts"
    ]
  },
  solana: {
    name: "Solana",
    fullName: "Solana Blockchain",
    title: "Ultra-Fast Solana & USDT Payments for your Business",
    description: "Leverage Solana's speed with Reqst's professional infrastructure. Accept SOL and SPL tokens with zero friction.",
    features: [
      "SOL & SPL Tokens (USDC/USDT)",
      "Sub-second detection",
      "Scalable for high-load projects",
      "Direct-to-Wallet security"
    ]
  },
  base: {
    name: "Base",
    fullName: "Base (Coinbase L2)",
    title: "Accept Base L2 Payments with Professional Gateway",
    description: "Onboard the next billion users on Base. Reqst offers seamless L2 processing with instant settlement.",
    features: [
      "ETH & ERC-20 on Base",
      "Low transaction costs",
      "Ethereum-grade security",
      "Instant webhook notifications"
    ]
  },
  bsc: {
    name: "BSC",
    fullName: "BNB Smart Chain",
    title: "Accept BNB & BEP-20 Payments with Zero Commission",
    description: "Connect to the massive BSC ecosystem. Reqst provides high-speed BEP-20 token monitoring and direct-to-wallet payouts.",
    features: [
      "BNB & BEP-20 (USDT/USDC)",
      "Ultra-low network fees",
      "High reliability architecture",
      "Instant checkout integration"
    ]
  },
  arbitrum: {
    name: "Arbitrum",
    fullName: "Arbitrum One",
    title: "Scale your Business with Arbitrum L2 Payments",
    description: "Enjoy Ethereum's security with L2 performance. Reqst offers seamless Arbitrum processing for high-volume merchants.",
    features: [
      "ETH & ERC-20 on Arbitrum",
      "Optimistic Rollup efficiency",
      "Secure direct-to-wallet flow",
      "Real-time event monitoring"
    ]
  }
};

type Props = {
  params: Promise<{ network: string; locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { network, locale } = await props.params;
  const data = NETWORKS[network as keyof typeof NETWORKS];
  
  if (!data) return { title: "Network Not Found" };

  return {
    title: `${data.title} | Reqst`,
    description: data.description,
    alternates: {
      canonical: `/${locale}/networks/${network}`,
    },
    openGraph: {
      title: data.title,
      description: data.description,
    }
  };
}

export default async function NetworkPage(props: Props) {
  const { network, locale } = await props.params;
  const data = NETWORKS[network as keyof typeof NETWORKS];

  if (!data) notFound();

  const breadcrumbs = [
    { label: locale === "ru" ? "Главная" : "Home", href: `/${locale}` },
    { label: locale === "ru" ? "Сети" : "Networks", href: `/${locale}/networks` },
    { label: data.name, href: `/${locale}/networks/${network}` },
  ];

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `Reqst ${data.name} Gateway`,
    "operatingSystem": "Web",
    "applicationCategory": "PaymentApplication",
    "description": data.description
  };

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <JsonLd schema={softwareSchema} />
      <div style={{ maxWidth: "1200px", margin: "4rem auto", padding: "0 1.5rem" }}>
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header style={{ marginTop: "3rem", marginBottom: "5rem" }}>
          <span style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {data.fullName}
          </span>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "var(--ink)", lineHeight: 1.1, marginTop: "1rem", marginBottom: "1.5rem", letterSpacing: "-0.03em" }}>
            {data.title}
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--muted)", maxWidth: "800px", lineHeight: 1.6 }}>
            {data.description}
          </p>
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "3rem" }}>
            <Link href="/app/auth" className="lend-primary">Get Started</Link>
            <Link href={`/${locale}/dev`} className="lend-secondary">API Docs</Link>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", marginBottom: "8rem" }}>
          {data.features.map((feature, i) => (
            <div key={i} className="lend-card" style={{ padding: "2rem" }}>
              <div style={{ color: "var(--accent)", marginBottom: "1rem", fontSize: "1.5rem" }}>✓</div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--ink)", marginBottom: "0.5rem" }}>{feature}</h3>
            </div>
          ))}
        </section>

        <section className="lend-dogfood-section" style={{ borderRadius: "24px", padding: "4rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "2.5rem", color: "var(--ink)", marginBottom: "2rem" }}>Why choose Reqst for {data.name}?</h2>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", maxWidth: "700px", marginBottom: "3rem" }}>
            Reqst provides a pure non-custodial layer for {data.name} processing. Unlike traditional gateways, we don&apos;t hold your funds. 
            Payments go from your customers directly to your {data.name} wallet.
          </p>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            <li style={{ color: "var(--ink)", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ color: "var(--accent)" }}>●</span> Fixed $199/mo, no % fees
            </li>
            <li style={{ color: "var(--ink)", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ color: "var(--accent)" }}>●</span> Real-time monitoring
            </li>
            <li style={{ color: "var(--ink)", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ color: "var(--accent)" }}>●</span> Instant webhooks
            </li>
            <li style={{ color: "var(--ink)", display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ color: "var(--accent)" }}>●</span> 100% Direct-to-Wallet
            </li>
          </ul>
        </section>
      </div>
    </MarketingLayout>
  );
}
