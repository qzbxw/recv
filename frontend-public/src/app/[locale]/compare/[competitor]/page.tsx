import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";

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

  const breadcrumbs = [
    { label: locale === "ru" ? "Главная" : "Home", href: `/${locale}` },
    { label: locale === "ru" ? "Сравнение" : "Compare", href: `/${locale}/compare` },
    { label: `vs ${data.name}`, href: `/${locale}/compare/${competitor}` },
  ];

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div style={{ maxWidth: "1200px", margin: "4rem auto", padding: "0 1.5rem" }}>
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header style={{ marginTop: "3rem", marginBottom: "5rem" }}>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "var(--ink)", lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.03em" }}>
            {data.title}
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--muted)", maxWidth: "800px", lineHeight: 1.6 }}>
            {data.description}
          </p>
        </header>

        <section style={{ marginBottom: "8rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {data.points.map((point, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", borderBottom: "1px solid var(--line)", paddingBottom: "2rem" }}>
                <div>
                  <h3 style={{ color: "var(--ink)", fontSize: "1.5rem", marginBottom: "1rem" }}>{point.title}</h3>
                </div>
                <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>{data.name}</span>
                  <p style={{ color: "var(--muted)" }}>{(point as any).manual || (point as any).custodial}</p>
                </div>
                <div style={{ padding: "1.5rem", background: "rgba(0, 102, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(0, 102, 255, 0.2)" }}>
                  <span style={{ color: "var(--accent)", fontSize: "0.8rem", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>Reqst</span>
                  <p style={{ color: "var(--ink)", fontWeight: 500 }}>{point.reqst}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign: "center", padding: "4rem", background: "var(--ink)", color: "var(--paper)", borderRadius: "24px" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Ready to upgrade your infrastructure?</h2>
          <p style={{ opacity: 0.8, marginBottom: "2.5rem", maxWidth: "500px", margin: "0 auto 2.5rem" }}>
            Join forward-thinking companies that choose Reqst for secure, non-custodial processing.
          </p>
          <Link href="/app/auth" className="lend-primary" style={{ background: "var(--paper)", color: "var(--ink)" }}>Start Free Trial</Link>
        </section>
      </div>
    </MarketingLayout>
  );
}
