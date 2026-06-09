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
    ? "Расширенные лимиты API, командный доступ и приоритетная поддержка для компаний с большим объёмом non-custodial криптоплатежей."
    : "Extended API limits, team access, and priority support for businesses operating higher-volume non-custodial crypto payment workflows.");
  return {
    title: locale === "ru" ? "Криптопроцессинг для бизнеса и команд | recv" : "Scalable Crypto Processing for Business Teams | recv",
    description,
    alternates: {
      canonical: `/${locale}/business`,
      languages: languageAlternates("/business"),
    },
    openGraph: {
      title: locale === "ru" ? "recv Business" : "recv Business",
      images: socialImages(locale, locale === "ru" ? "recv Business" : "recv Business", locale === "ru" ? "Тариф" : "Plan"),
      description,
    },
  };
}

export default async function Page(props: Props) {
  const { locale } = await props.params;
  return <PlanPage variant="business" language={locale === "ru" ? "ru" : "en"} />;
}
