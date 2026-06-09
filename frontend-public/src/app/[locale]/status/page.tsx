import { Metadata } from "next";
import { StatusPageClient } from "@/components/StatusPageClient";
import { PUBLIC_MARKETING_COPY } from "@/i18n";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const lang = locale === "ru" ? "ru" : "en";
  const copy = PUBLIC_MARKETING_COPY[lang];
  const description = metadataDescription(lang, copy.statusHub.description);

  return {
    title: `${copy.statusHub.title} | recv`,
    description,
    alternates: {
      canonical: `/${lang}/status`,
      languages: {
        en: "/en/status",
        ru: "/ru/status",
        "x-default": "/en/status",
      },
    },
    openGraph: {
      title: `${copy.statusHub.title} | recv`,
      images: socialImages(lang, `${copy.statusHub.title} | recv`, lang === "ru" ? "Статус" : "Status"),
      description,
    },
  };
}

export default async function Page(props: Props) {
  const { locale } = await props.params;
  return <StatusPageClient language={locale === "ru" ? "ru" : "en"} />;
}
