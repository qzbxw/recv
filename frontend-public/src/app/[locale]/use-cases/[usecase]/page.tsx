import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";

const USE_CASES = {
  "telegram-shops": {
    name: "Telegram Shops",
    title: "Crypto Payment Gateway for Telegram Shops",
    description: "Automate your Telegram shop with Reqst. Seamlessly accept TON, USDT, and other tokens directly to your wallet with zero commission.",
    benefits: [
      "Native Telegram UX integration",
      "Instant payment notifications via webhooks",
      "Support for TON, TRON, and Solana",
      "No middleman, no blocking risks"
    ]
  },
  "saas-billing": {
    name: "SaaS Billing",
    title: "Idempotent Crypto Billing for SaaS & Digital Services",
    description: "Scale your SaaS globally with non-custodial crypto payments. Fixed monthly fee, high-performance API, and guaranteed webhook delivery.",
    benefits: [
      "Idempotency for reliable billing",
      "Unified API for multiple networks",
      "Enterprise-grade throughput",
      "Fixed $199/mo, regardless of volume"
    ]
  },
  "digital-goods": {
    name: "Digital Goods",
    title: "Accept Crypto for Digital Goods & Software",
    description: "The perfect gateway for selling licenses, keys, and downloads. Instant payment detection and direct-to-wallet security.",
    benefits: [
      "Sub-second transaction detection",
      "Automated license delivery hooks",
      "Global reach without chargebacks",
      "Pure non-custodial infrastructure"
    ]
  },
  "paid-communities": {
    name: "Paid Communities",
    title: "Crypto Subscriptions for Communities & Newsletters",
    description: "Manage your community access with automated crypto processing. Perfect for private Telegram channels and Discord servers.",
    benefits: [
      "Seamless recurring-like experience",
      "Real-time access management via webhooks",
      "Non-custodial and private",
      "Support for stablecoins across 7+ networks"
    ]
  }
};

type Props = {
  params: Promise<{ usecase: string; locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { usecase, locale } = await props.params;
  const data = USE_CASES[usecase as keyof typeof USE_CASES];
  
  if (!data) return { title: "Use Case Not Found" };

  return {
    title: `${data.title} | Reqst`,
    description: data.description,
    alternates: {
      canonical: `/${locale}/use-cases/${usecase}`,
    },
    openGraph: {
      title: data.title,
      description: data.description,
    }
  };
}

export default async function UseCasePage(props: Props) {
  const { usecase, locale } = await props.params;
  const data = USE_CASES[usecase as keyof typeof USE_CASES];

  if (!data) notFound();

  const breadcrumbs = [
    { label: locale === "ru" ? "Главная" : "Home", href: `/${locale}` },
    { label: locale === "ru" ? "Применение" : "Use Cases", href: `/${locale}/use-cases` },
    { label: data.name, href: `/${locale}/use-cases/${usecase}` },
  ];

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div style={{ maxWidth: "1200px", margin: "4rem auto", padding: "0 1.5rem" }}>
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header style={{ marginTop: "3rem", marginBottom: "5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "var(--ink)", lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.03em" }}>
            {data.title}
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--muted)", maxWidth: "800px", lineHeight: 1.6, margin: "0 auto" }}>
            {data.description}
          </p>
          
          <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", justifyContent: "center" }}>
            <Link href="/app/auth" className="lend-primary">Get Started Now</Link>
            <Link href={`/${locale}/dev`} className="lend-secondary">View Documentation</Link>
          </div>
        </header>

        <section style={{ marginBottom: "8rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            {data.benefits.map((benefit, i) => (
              <article key={i} className="lend-card" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <span style={{ color: "var(--accent)", fontSize: "1.5rem", fontWeight: "bold" }}>0{i + 1}</span>
                <p style={{ fontSize: "1.1rem", color: "var(--ink)", lineHeight: 1.5 }}>{benefit}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ textAlign: "center", padding: "6rem 2rem", background: "linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)", borderRadius: "32px", border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "2.5rem", color: "var(--ink)", marginBottom: "1.5rem" }}>Built for Professionals</h2>
          <p style={{ color: "var(--muted)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 3rem" }}>
            Whether you are running a boutique Telegram shop or a high-traffic SaaS, Reqst provides the infrastructure you need to scale without friction.
          </p>
          <Link href="/app/auth" className="lend-primary">Start Accepting Payments</Link>
        </section>
      </div>
    </MarketingLayout>
  );
}
