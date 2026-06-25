import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/StaticMarketingPage";
import { getStaticPageCopy } from "@/lib/static-pages";
import { normalizeLocale } from "@/i18n";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const copy = getStaticPageCopy("changelog", locale);
  return {
    title: `${copy.title} | recv`,
    description: metadataDescription(locale, copy.body),
    alternates: { canonical: `/${locale}/changelog`, languages: { en: "/en/changelog", ru: "/ru/changelog", "x-default": "/en/changelog" } },
    openGraph: { images: socialImages(locale, copy.title, locale === "ru" ? "Обновления" : "Changelog") },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const normalizedLocale = normalizeLocale(locale);
  return <StaticMarketingPage locale={locale} path="/changelog" copy={getStaticPageCopy("changelog", normalizedLocale)} />;
}
