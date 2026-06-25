import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/StaticMarketingPage";
import { getStaticPageCopy } from "@/lib/static-pages";
import { normalizeLocale } from "@/i18n";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const copy = getStaticPageCopy("about", locale);
  return {
    title: `${copy.title} | recv`,
    description: metadataDescription(locale, copy.body),
    keywords: locale === "ru"
      ? "recv команда, о recv, крипто процессинг компания, non-custodial инфраструктура"
      : "about recv, recv team, crypto processing company, non-custodial payment infrastructure",
    alternates: { canonical: `/${locale}/about`, languages: { en: "/en/about", ru: "/ru/about", "x-default": "/en/about" } },
    openGraph: { images: socialImages(locale, copy.title, locale === "ru" ? "Компания" : "Company") },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const normalizedLocale = normalizeLocale(locale);
  return <StaticMarketingPage locale={locale} path="/about" copy={getStaticPageCopy("about", normalizedLocale)} />;
}
