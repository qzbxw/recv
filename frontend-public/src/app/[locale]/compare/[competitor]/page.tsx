import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { PUBLIC_MARKETING_COPY } from "@/i18n";

const COMPARISONS = {
  "reqst-vs-manual": {
    name: "Manual Payments",
    title: "Reqst vs Manual Wallet Payments: Why Automate?",
    description: "Comparing automated non-custodial processing with manual wallet tracking. Learn how Reqst eliminates human error and scales your crypto operations.",
    points: [
      {
        title: "Scaling",
        manual: "Impossible to scale. Every transaction requires manual verification.",
        reqst: "Fully automated. Handle thousands of invoices simultaneously with real-time monitoring."
      },
      {
        title: "Error Rate",
        manual: "High risk of human error in accounting and verification.",
        reqst: "Zero errors. Automated matching of amounts, networks, and TX hashes."
      },
      {
        title: "Customer Experience",
        manual: "Slow. Customers wait for manual confirmation.",
        reqst: "Instant. Real-time detection and immediate access/delivery."
      }
    ]
  },
  "reqst-vs-custodial": {
    name: "Custodial Gateways",
    title: "Reqst vs Custodial Gateways: Non-Custodial Advantage",
    description: "Why pay 1-3% commission and risk your funds? Compare Reqst's non-custodial infrastructure with traditional custodial payment processors.",
    points: [
      {
        title: "Fund Control",
        custodial: "They hold your money. Risk of frozen accounts and delays.",
        reqst: "100% Non-custodial. Funds go directly to your wallet. We never touch them."
      },
      {
        title: "Fees",
        custodial: "1% to 3% of every transaction. Costs grow with your business.",
        reqst: "Fixed $199/mo. Zero turnover fees. Save thousands as you scale."
      },
      {
        title: "Privacy",
        custodial: "Extensive KYC/KYB and data sharing.",
        reqst: "Pure software layer. No middleman, maximum privacy for your infrastructure."
      }
    ]
  }
};

type ComparisonPoint = {
  title: string;
  reqst: string;
  manual?: string;
  custodial?: string;
};

type Props = {
  params: Promise<{ competitor: string; locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { competitor, locale } = await props.params;
  const data = COMPARISONS[competitor as keyof typeof COMPARISONS];
  
  if (!data) return { title: "Comparison Not Found" };

  return {
    title: `${data.title} | Reqst`,
    description: data.description,
    alternates: {
      canonical: `/${locale}/compare/${competitor}`,
    },
    openGraph: {
      title: data.title,
      description: data.description,
    }
  };
}

export default async function ComparePage(props: Props) {
  const { competitor, locale } = await props.params;
  const data = COMPARISONS[competitor as keyof typeof COMPARISONS];

  if (!data) notFound();

  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.breadcrumbs.compare, href: `/${locale}/compare` },
    { label: `vs ${data.name}`, href: `/${locale}/compare/${competitor}` },
  ];

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header className="page-header">
          <h1 className="page-title">
            {data.title}
          </h1>
          <p className="page-subtitle" style={{ margin: "0" }}>
            {data.description}
          </p>
        </header>

        <section className="page-section">
          <div className="compare-grid">
            {data.points.map((point, i) => (
              <div key={i} className="compare-row">
                <div>
                  <h3 className="compare-title">{point.title}</h3>
                </div>
                <div className="compare-box">
                  <span className="compare-box__label">{data.name}</span>
                  <p className="compare-box__text">{(point as ComparisonPoint).manual || (point as ComparisonPoint).custodial}</p>
                </div>
                <div className="compare-box compare-box--accent">
                  <span className="compare-box__label">Reqst</span>
                  <p className="compare-box__text">{point.reqst}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="compare-cta-block">
          <h2>Ready to upgrade your infrastructure?</h2>
          <p>
            Join forward-thinking companies that choose Reqst for secure, non-custodial processing.
          </p>
          <Link href="/app/auth" className="lend-primary">Start Free Trial</Link>
        </section>
      </div>
    </MarketingLayout>
  );
}
