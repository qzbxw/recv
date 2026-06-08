import { LegalPage } from "@/components/LegalPageClient";
import { Metadata } from "next";
import { languageAlternates } from "@/lib/seo";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const language = locale === "ru" ? "ru" : "en";
  const title = language === "ru" ? "Условия использования | recv" : "Terms of Service | recv";
  const description = language === "ru"
    ? "Условия использования сервиса recv."
    : "Terms of Service and End-User License Agreement.";
  return {
    title,
    description,
    alternates: {
      canonical: `/${language}/terms`,
      languages: languageAlternates("/terms"),
    },
    openGraph: { title, description },
  };
}

export default function Page() {
  return <LegalPage variant="terms" />;
}
