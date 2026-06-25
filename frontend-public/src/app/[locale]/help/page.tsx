import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/StaticMarketingPage";
import { getStaticPageCopy } from "@/lib/static-pages";
import { normalizeLocale } from "@/i18n";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const copy = getStaticPageCopy("help", locale);
  return {
    title: `${copy.title} | recv`,
    description: metadataDescription(locale, copy.body),
    keywords: locale === "ru"
      ? "recv помощь, крипто платежи FAQ, настройка recv, recv API документация, recv поддержка"
      : "recv help, crypto payments FAQ, recv setup guide, recv API documentation, recv support",
    alternates: { canonical: `/${locale}/help`, languages: { en: "/en/help", ru: "/ru/help", "x-default": "/en/help" } },
    openGraph: { images: socialImages(locale, copy.title, locale === "ru" ? "Помощь" : "Help") },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const normalizedLocale = normalizeLocale(locale);
  return <StaticMarketingPage locale={locale} path="/help" copy={getStaticPageCopy("help", normalizedLocale)} />;
}
