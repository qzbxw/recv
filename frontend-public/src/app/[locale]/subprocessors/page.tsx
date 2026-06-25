import { LegalPage } from "@/components/LegalPageClient";
import { Metadata } from "next";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";
import { normalizeLocale } from "@/i18n";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const language = normalizeLocale(locale);
  const title = language === "ru" ? "Список субподрядчиков | recv" : "Subprocessors List | recv";
  const description = metadataDescription(language, language === "ru"
    ? "Список утвержденных сторонних субподрядчиков recv."
    : "Approved third-party subprocessors for recv.");
  return {
    title,
    description,
    alternates: {
      canonical: `/${language}/subprocessors`,
      languages: languageAlternates("/subprocessors"),
    },
    openGraph: { title, description, images: socialImages(language, title, language === "ru" ? "Документы" : "Legal") },
  };
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <LegalPage variant="subprocessors" language={normalizeLocale(locale)} />;
}
