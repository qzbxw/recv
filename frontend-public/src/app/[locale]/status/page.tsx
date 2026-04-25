import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PUBLIC_MARKETING_COPY } from "@/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];

  return {
    title: `${copy.statusHub.title} | Reqst`,
    description: copy.statusHub.description,
    alternates: {
      canonical: `/${locale}/status`,
    },
  };
}

export default async function StatusPage(props: Props) {
  const { locale } = await props.params;
  const copy = PUBLIC_MARKETING_COPY[locale as "en" | "ru"];
  
  const breadcrumbs = [
    { label: copy.breadcrumbs.home, href: `/${locale}` },
    { label: copy.statusHub.title, href: `/${locale}/status` },
  ];

  const systems = [
    { name: copy.statusHub.coreApi, status: copy.statusHub.operational },
    { name: copy.statusHub.watchers, status: copy.statusHub.operational },
    { name: copy.statusHub.checkout, status: copy.statusHub.operational },
  ];

  const networks = [
    { name: "TON", status: copy.statusHub.operational },
    { name: "TRON", status: copy.statusHub.operational },
    { name: "Solana", status: copy.statusHub.operational },
    { name: "Base", status: copy.statusHub.operational },
    { name: "BSC", status: copy.statusHub.operational },
    { name: "Arbitrum", status: copy.statusHub.operational },
  ];

  const kickerStyle = { color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div className="page-container">
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header className="page-header page-header--centered">
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            padding: "0.5rem 1rem", 
            borderRadius: "9999px", 
            background: "rgba(16, 185, 129, 0.1)", 
            border: "1px solid rgba(16, 185, 129, 0.2)",
            color: "#10b981",
            fontSize: "0.85rem",
            fontWeight: 700,
            marginBottom: "2rem"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "block" }}></span>
            {copy.statusHub.allSystemsOperational}
          </div>
          <h1 className="page-title">
            {copy.statusHub.title}
          </h1>
          <p className="page-subtitle">
            {copy.statusHub.description}
          </p>
        </header>

        <section className="page-section">
          <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: "1.5rem", paddingLeft: "0.5rem" }}>
            {copy.statusHub.services}
          </h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {systems.map((sys) => (
              <div key={sys.name} style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "1.5rem", 
                borderRadius: "1rem", 
                background: "rgba(255,255,255,0.03)", 
                border: "1px solid rgba(255,255,255,0.05)" 
              }}>
                <span style={{ fontWeight: 600 }}>{sys.name}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {sys.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section">
          <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: "1.5rem", paddingLeft: "0.5rem" }}>
            {copy.statusHub.networks}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {networks.map((net) => (
              <div key={net.name} style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "1.25rem", 
                borderRadius: "1rem", 
                background: "rgba(255,255,255,0.03)", 
                border: "1px solid rgba(255,255,255,0.05)" 
              }}>
                <span style={{ fontWeight: 600 }}>{net.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                   <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {net.status}
                  </span>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "block", boxShadow: "0 0 8px #10b981" }}></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="page-final-section">
          <h2 className="page-final-title">Reliability is our priority</h2>
          <p className="page-final-text">
            We operate a distributed infrastructure with multiple redundancy levels to ensure your payments are always processed on time.
          </p>
        </section>
      </div>
    </MarketingLayout>
  );
}
