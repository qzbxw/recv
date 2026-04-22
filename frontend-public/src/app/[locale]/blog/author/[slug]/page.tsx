import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";

const AUTHORS = {
  "reqst-core": {
    name: "Reqst Core Team",
    bio: "The engineering team behind Reqst protocol. Focused on building high-performance, non-custodial crypto infrastructure.",
    role: "Engineering & Product",
    avatar: "/logo.jpg"
  }
};

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, locale } = await props.params;
  const data = AUTHORS[slug as keyof typeof AUTHORS];
  
  if (!data) return { title: "Author Not Found" };

  return {
    title: `${data.name} | Reqst Blog`,
    description: data.bio,
    alternates: {
      canonical: `/${locale}/blog/author/${slug}`,
    },
  };
}

export default async function AuthorPage(props: Props) {
  const { slug, locale } = await props.params;
  const data = AUTHORS[slug as keyof typeof AUTHORS];

  if (!data) notFound();

  const breadcrumbs = [
    { label: locale === "ru" ? "Главная" : "Home", href: `/${locale}` },
    { label: locale === "ru" ? "Блог" : "Blog", href: `/${locale}/blog` },
    { label: data.name, href: `/${locale}/blog/author/${slug}` },
  ];

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <div style={{ maxWidth: "800px", margin: "4rem auto", padding: "0 1.5rem" }}>
        <Breadcrumbs items={breadcrumbs} locale={locale} />
        
        <header style={{ marginTop: "3rem", marginBottom: "5rem", textAlign: "center" }}>
          <img 
            src={data.avatar} 
            alt={data.name} 
            style={{ width: "120px", height: "120px", borderRadius: "50%", marginBottom: "2rem", border: "4px solid var(--line)" }} 
          />
          <h1 style={{ fontSize: "2.5rem", color: "var(--ink)", marginBottom: "1rem" }}>{data.name}</h1>
          <span style={{ color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
            {data.role}
          </span>
          <p style={{ fontSize: "1.2rem", color: "var(--muted)", marginTop: "1.5rem", lineHeight: 1.6 }}>
            {data.bio}
          </p>
        </header>

        <section>
          <h2 style={{ fontSize: "1.5rem", color: "var(--ink)", marginBottom: "2rem", borderBottom: "1px solid var(--line)", paddingBottom: "1rem" }}>
            Articles by {data.name}
          </h2>
          <p style={{ color: "var(--muted)" }}>
            Coming soon... Browse our <Link href={`/${locale}/blog`} style={{ color: "var(--accent)" }}>full blog</Link> for recent updates.
          </p>
        </section>
      </div>
    </MarketingLayout>
  );
}
