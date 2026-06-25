import { LegalPage } from "@/components/LegalPageClient";
import { Metadata } from "next";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";
import { normalizeLocale } from "@/i18n";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const language = normalizeLocale(locale);
  const title = language === "ru" ? "Соглашение об обработке данных (DPA) | recv" : "Data Processing Addendum (DPA) | recv";
  const description = metadataDescription(language, language === "ru"
    ? "Соглашение об обработке персональных данных recv."
    : "Data processing addendum for recv.");
  return {
    title,
    description,
    alternates: {
      canonical: `/${language}/dpa`,
      languages: languageAlternates("/dpa"),
    },
    openGraph: { title, description, images: socialImages(language, title, language === "ru" ? "Документы" : "Legal") },
  };
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <LegalPage variant="dpa" language={normalizeLocale(locale)} />;
}
