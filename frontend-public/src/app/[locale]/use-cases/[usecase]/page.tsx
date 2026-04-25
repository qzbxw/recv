import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { PUBLIC_MARKETING_COPY } from "@/i18n";

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

  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.breadcrumbs.useCases, href: `/${locale}/use-cases` },
    { label: data.name, href: `/${locale}/use-cases/${usecase}` },
  ];

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header className="page-header">
          <h1 className="page-title">
            {data.title}
          </h1>
          <p className="page-subtitle">
            {data.description}
          </p>
          
          <div className="page-cta-row">
            <Link href="/app/auth" className="lend-primary">Get Started Now</Link>
            <Link href={`/${locale}/dev`} className="lend-secondary">View Documentation</Link>
          </div>
        </header>

        <section className="page-section">
          <div className="benefits-grid">
            {data.benefits.map((benefit, i) => (
              <article key={i} className="lend-card benefit-card">
                <span className="benefit-number">0{i + 1}</span>
                <p className="benefit-text">{benefit}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-final-section">
          <h2 className="page-final-title">Built for Professionals</h2>
          <p className="page-final-text">
            Whether you are running a boutique Telegram shop or a high-traffic SaaS, Reqst provides the infrastructure you need to scale without friction.
          </p>
          <Link href="/app/auth" className="lend-primary">Start Accepting Payments</Link>
        </section>
      </div>
    </MarketingLayout>
  );
}
