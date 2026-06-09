import { LegalPage } from "@/components/LegalPageClient";
import { Metadata } from "next";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const language = locale === "ru" ? "ru" : "en";
  const title = language === "ru" ? "Политика конфиденциальности | recv" : "Privacy Policy | recv";
  const description = metadataDescription(language, language === "ru"
    ? "Политика конфиденциальности и обработки данных recv."
    : "Privacy policy and data processing agreement for recv.");
  return {
    title,
    description,
    alternates: {
      canonical: `/${language}/privacy`,
      languages: languageAlternates("/privacy"),
    },
    openGraph: { title, description, images: socialImages(language, title, language === "ru" ? "Документы" : "Legal") },
  };
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <LegalPage variant="privacy" language={locale === "ru" ? "ru" : "en"} />;
}
