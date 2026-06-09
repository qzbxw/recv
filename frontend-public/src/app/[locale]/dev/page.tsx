import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = rawLocale === "ru" ? "ru" : "en";
  const description = metadataDescription(locale, locale === "ru"
    ? "Developer API recv, подписанные вебхуки и инструменты интеграции для автоматизации non-custodial криптоплатежей."
    : "recv Developer API, signed webhooks, and integration tools for automating reliable non-custodial crypto payment workflows.");
  return {
    title: locale === "ru" ? "Developer API и вебхуки для криптоплатежей | recv" : "Crypto Payment API and Webhooks for Developers | recv",
    description,
    alternates: {
      canonical: `/${locale}/dev`,
      languages: languageAlternates("/dev"),
    },
    openGraph: {
      title: locale === "ru" ? "Developer API recv" : "recv Developer API",
      images: socialImages(locale, locale === "ru" ? "Developer API recv" : "recv Developer API", locale === "ru" ? "Тариф" : "Plan"),
      description,
    },
  };
}

export default async function Page(props: Props) {
  const { locale } = await props.params;
  return <PlanPage variant="developer" language={locale === "ru" ? "ru" : "en"} />;
}
