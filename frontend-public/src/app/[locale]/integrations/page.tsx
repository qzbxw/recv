import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/StaticMarketingPage";
import { STATIC_PAGE_COPY } from "@/lib/static-pages";
import { normalizeLocale } from "@/i18n";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const copy = STATIC_PAGE_COPY.integrations[locale];
  return {
    title: `${copy.title} | recv`,
    description: metadataDescription(locale, copy.body),
    keywords: locale === "ru"
      ? "recv API интеграция, crypto webhook, recv checkout, REST API крипто платежи, подписанные вебхуки"
      : "recv API integration, crypto webhook, recv checkout integration, REST API crypto payments, signed webhooks",
    alternates: { canonical: `/${locale}/integrations`, languages: { en: "/en/integrations", ru: "/ru/integrations", "x-default": "/en/integrations" } },
    openGraph: { images: socialImages(locale, copy.title, locale === "ru" ? "Интеграции" : "Integrations") },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <StaticMarketingPage locale={locale} path="/integrations" copy={STATIC_PAGE_COPY.integrations[normalizeLocale(locale)]} />;
}
