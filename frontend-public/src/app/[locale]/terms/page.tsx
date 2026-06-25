import { LegalPage } from "@/components/LegalPageClient";
import { Metadata } from "next";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";
import { normalizeLocale } from "@/i18n";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const language = normalizeLocale(locale);
  const title = language === "ru" ? "Условия использования | recv" : "Terms of Service | recv";
  const description = metadataDescription(language, language === "ru"
    ? "Условия использования сервиса recv."
    : "Terms of Service and End-User License Agreement.");
  return {
    title,
    description,
    alternates: {
      canonical: `/${language}/terms`,
      languages: languageAlternates("/terms"),
    },
    openGraph: { title, description, images: socialImages(language, title, language === "ru" ? "Документы" : "Legal") },
  };
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <LegalPage variant="terms" language={normalizeLocale(locale)} />;
}
